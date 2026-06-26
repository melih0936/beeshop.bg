"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase-client";

export default function FavoriteButton({
  listingId,
  compact = false,
}: {
  listingId: string;
  compact?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadFavorite() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setUserId(user?.id ?? null);

      if (!user) {
        return;
      }

      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listingId)
        .maybeSingle();

      if (mounted) {
        setFavoriteId(data?.id ?? null);
      }
    }

    loadFavorite();

    return () => {
      mounted = false;
    };
  }, [listingId, supabase]);

  async function toggleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!userId) {
      router.push("/auth");
      return;
    }

    setLoading(true);

    if (favoriteId) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId)
        .eq("user_id", userId);

      if (!error) {
        setFavoriteId(null);
      }
    } else {
      const { data, error } = await supabase
        .from("favorites")
        .insert({ user_id: userId, listing_id: listingId })
        .select("id")
        .single();

      if (!error) {
        setFavoriteId(data.id);
      }
    }

    setLoading(false);
    router.refresh();
  }

  const active = Boolean(favoriteId);

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={loading}
      className={
        compact
          ? `inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white ${
              active
                ? "border-red-200 text-red-600"
                : "border-slate-200 text-slate-600"
            } transition active:scale-95 hover:bg-slate-50 disabled:opacity-60`
          : `inline-flex w-full items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-black ${
              active
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-slate-300 bg-white text-slate-900"
            } transition active:scale-[0.98] hover:bg-slate-50 disabled:opacity-60`
      }
      aria-label={active ? "Премахни от любими" : "Добави в любими"}
      title={active ? "Премахни от любими" : "Добави в любими"}
    >
      <Heart size={compact ? 16 : 17} fill={active ? "currentColor" : "none"} />
      {compact ? null : active ? "В любими" : "Любими"}
    </button>
  );
}
