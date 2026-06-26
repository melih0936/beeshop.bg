"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase-client";

export default function MessageButton({
  listingId,
  sellerId,
}: {
  listingId: string;
  sellerId: string | null | undefined;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setCurrentUserId(user?.id ?? null);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const isOwnListing = Boolean(currentUserId && sellerId && currentUserId === sellerId);

  async function openConversation() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      router.push("/auth");
      return;
    }

    if (!sellerId) {
      setErrorMessage("Тази обява няма свързан профил за съобщения.");
      setLoading(false);
      return;
    }

    if (user.id === sellerId) {
      setErrorMessage("Това е твоя обява.");
      setLoading(false);
      return;
    }

    const { data: existing, error: findError } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .eq("seller_id", sellerId)
      .maybeSingle();

    if (findError) {
      setErrorMessage(findError.message);
      setLoading(false);
      return;
    }

    if (existing?.id) {
      router.push(`/messages/${existing.id}`);
      return;
    }

    const { data: created, error: createError } = await supabase
      .from("conversations")
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerId,
      })
      .select("id")
      .single();

    setLoading(false);

    if (createError || !created?.id) {
      setErrorMessage(createError?.message || "Не успяхме да създадем разговор.");
      return;
    }

    router.push(`/messages/${created.id}`);
  }

  if (!currentUserId && sellerId) {
    return (
      <Link
        href="/auth"
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-900 hover:bg-slate-50 active:scale-[0.98]"
      >
        <MessageCircle size={17} />
        Съобщение
      </Link>
    );
  }

  return (
    <div>
      {isOwnListing ? (
        <p className="mb-2 rounded-md bg-slate-100 px-3 py-2 text-center text-sm font-bold text-slate-700">
          Това е твоя обява
        </p>
      ) : null}
      <button
        type="button"
        onClick={openConversation}
        disabled={loading || !sellerId || isOwnListing}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <MessageCircle size={17} />
        {loading ? "Отваряне..." : "Съобщение"}
      </button>
      {errorMessage ? (
        <p className="mt-2 text-xs font-semibold text-red-700">{errorMessage}</p>
      ) : null}
    </div>
  );
}
