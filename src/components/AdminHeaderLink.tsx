"use client";

import Link from "next/link";
import { BadgeCheck, Flag, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase-client";

export default function AdminHeaderLink() {
  const supabase = useMemo(() => createClient(), []);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setIsAdmin(isAdminEmail(user?.email));
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Link
        href="/admin/moderation"
        className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] md:inline-flex"
        title="Модерация"
      >
        <ShieldCheck size={16} />
        Модерация
      </Link>
      <Link
        href="/admin/reports"
        className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] md:inline-flex"
        title="Доклади"
      >
        <Flag size={16} />
        Доклади
      </Link>
      <Link
        href="/admin/verified"
        className="hidden items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-100 active:scale-[0.98] md:inline-flex"
        title="Проверки"
      >
        <BadgeCheck size={16} />
        Проверки
      </Link>
    </>
  );
}
