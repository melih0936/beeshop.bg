"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase-client";
import { getUnreadMessagesCount } from "@/lib/messages-client";

export default function MessagesButton() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadUnreadCount(nextUserId: string | null) {
      if (!nextUserId) {
        setUnreadCount(0);
        return;
      }

      const count = await getUnreadMessagesCount(supabase, nextUserId);

      if (mounted) {
        setUnreadCount(count);
      }
    }

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setUserId(user?.id ?? null);
      await loadUnreadCount(user?.id ?? null);
    }

    loadUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id ?? null;
      setUserId(nextUserId);
      loadUnreadCount(nextUserId);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  if (!userId) {
    return null;
  }

  return (
    <Link
      href="/messages"
      className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      aria-label="Съобщения"
      title="Съобщения"
    >
      <MessageCircle size={17} />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-black leading-none text-white ring-2 ring-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
