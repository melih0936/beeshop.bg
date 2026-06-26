"use client";

import { useEffect, useMemo, useState } from "react";
import { Phone } from "lucide-react";
import { createClient } from "@/lib/supabase-client";

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length < 4) {
    return phone ? `${phone.slice(0, 3)} *** ****` : "";
  }

  return `${digits.slice(0, 3)} *** ****`;
}

export function SellerPhoneText({ phone }: { phone: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setIsLoggedIn(Boolean(user));
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <div className="mt-1">
      <p className="text-sm text-slate-600">
        {isLoggedIn ? phone : maskPhone(phone)}
      </p>
      {!isLoggedIn ? (
        <p className="mt-1 text-xs font-semibold text-amber-700">
          Влез в профила си, за да видиш целия телефон.
        </p>
      ) : null}
    </div>
  );
}

export function SellerPhoneButton({
  phone,
  compact = false,
}: {
  phone: string;
  compact?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setIsLoggedIn(Boolean(user));
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        disabled
        className={
          compact
            ? "inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-200 text-slate-500"
            : "inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-200 px-4 py-3 text-sm font-black text-slate-500"
        }
        title="Влез в профила си, за да видиш целия телефон."
      >
        <Phone size={17} />
        {compact ? null : "Звънни"}
      </button>
    );
  }

  return (
    <a
      href={`tel:${phone}`}
      className={
        compact
          ? "inline-flex h-9 w-9 items-center justify-center rounded-md bg-amber-500 text-white transition hover:bg-amber-600 active:scale-95"
          : "inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-3 text-sm font-black text-white hover:bg-amber-600 active:scale-[0.98]"
      }
      aria-label="Звънни"
      title="Звънни"
    >
      <Phone size={17} />
      {compact ? null : "Звънни"}
    </a>
  );
}
