"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase-client";

export default function AuthMenu() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setEmail(user?.email ?? null);
      setFullName(user?.user_metadata?.full_name ?? null);
    }

    getUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      setFullName(session?.user.user_metadata?.full_name ?? null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!email) {
    return (
      <Link
        href="/auth"
        className="rounded-md border border-slate-200 bg-white px-2.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:px-3 sm:text-sm"
      >
        Вход
        <span className="hidden sm:inline"> / Регистрация</span>
      </Link>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      <Link
        href="/profile"
        className="inline-flex h-10 max-w-10 items-center justify-center gap-2 rounded-md bg-slate-100 px-2.5 text-sm font-bold text-slate-800 hover:bg-slate-200 sm:max-w-36 sm:px-3"
        title={email}
      >
        <User size={15} className="shrink-0" />
        <span className="hidden truncate sm:inline">{fullName || "Профил"}</span>
      </Link>
      <button
        type="button"
        onClick={logout}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        aria-label="Изход"
        title="Изход"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
