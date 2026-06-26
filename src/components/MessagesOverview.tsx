"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { createClient } from "@/lib/supabase-client";
import {
  formatDate,
  type Conversation,
  type Listing,
  type Message,
} from "@/lib/marketplace";

type ConversationRow = {
  conversation: Conversation;
  listing: Listing | null;
  lastMessage: Message | null;
  otherName: string;
  unreadCount: number;
};

export default function MessagesOverview() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadConversations() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (!user) {
        router.replace("/auth");
        return;
      }

      const [
        { data: buyerConversations, error: buyerError },
        { data: sellerConversations, error: sellerError },
      ] = await Promise.all([
        supabase
          .from("conversations")
          .select("*")
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("conversations")
          .select("*")
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (!mounted) {
        return;
      }

      if (buyerError || sellerError) {
        setErrorMessage(buyerError?.message || sellerError?.message || "Грешка при зареждане.");
        setLoading(false);
        return;
      }

      const conversations = [
        ...((buyerConversations ?? []) as Conversation[]),
        ...((sellerConversations ?? []) as Conversation[]),
      ]
        .filter(
          (conversation, index, all) =>
            all.findIndex((item) => item.id === conversation.id) === index,
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      const listingIds = [...new Set(conversations.map((item) => item.listing_id))];
      const conversationIds = conversations.map((item) => item.id);

      const [{ data: listingsData }, { data: messagesData }] = await Promise.all([
        listingIds.length
          ? supabase.from("listings").select("*").in("id", listingIds)
          : Promise.resolve({ data: [] }),
        conversationIds.length
          ? supabase
              .from("messages")
              .select("*")
              .in("conversation_id", conversationIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      const listings = ((listingsData ?? []) as Listing[]).reduce<
        Record<string, Listing>
      >((acc, listing) => {
        acc[listing.id] = listing;
        return acc;
      }, {});

      const lastMessages = ((messagesData ?? []) as Message[]).reduce<
        Record<string, Message>
      >((acc, message) => {
        if (!acc[message.conversation_id]) {
          acc[message.conversation_id] = message;
        }
        return acc;
      }, {});
      const unreadCounts = ((messagesData ?? []) as Message[]).reduce<
        Record<string, number>
      >((acc, message) => {
        if (message.sender_id !== user.id && !message.read_at) {
          acc[message.conversation_id] =
            (acc[message.conversation_id] ?? 0) + 1;
        }
        return acc;
      }, {});

      const nextRows = conversations.map((conversation) => {
        const listing = listings[conversation.listing_id] ?? null;
        const isSeller = conversation.seller_id === user.id;

        return {
          conversation,
          listing,
          lastMessage: lastMessages[conversation.id] ?? null,
          otherName: isSeller ? "Купувач" : listing?.seller_name || "Продавач",
          unreadCount: unreadCounts[conversation.id] ?? 0,
        };
      });

      if (mounted) {
        setRows(nextRows);
        setLoading(false);
      }
    }

    loadConversations();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  if (loading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white/95 p-5 text-sm font-semibold shadow-sm">
        Зареждане на съобщенията...
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
        {errorMessage}
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Нямаш съобщения"
        description="Когато започнеш разговор по обява, той ще се появи тук."
        actionHref="/"
        actionLabel="Към обявите"
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      {rows.map(({ conversation, listing, lastMessage, otherName, unreadCount }) => (
        <Link
          key={conversation.id}
          href={`/messages/${conversation.id}`}
          className="block border-b border-slate-100 p-4 transition last:border-b-0 hover:bg-amber-50/60"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-black text-slate-950">
                {listing?.title || "Изтрита обява"}
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {otherName}
              </p>
              <p className="mt-2 line-clamp-1 text-sm text-slate-600">
                {lastMessage?.body || "Все още няма съобщения."}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="text-xs text-slate-400">
                {formatDate(lastMessage?.created_at || conversation.created_at)}
              </span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-black text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}
