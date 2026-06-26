"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, X } from "lucide-react";
import { createClient } from "@/lib/supabase-client";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
};

export default function SellerRatingSummary({
  sellerId,
  listingId,
  compact = false,
  interactive = false,
  initialAverage = 0,
  initialCount = 0,
}: {
  sellerId?: string | null;
  listingId?: string | null;
  compact?: boolean;
  interactive?: boolean;
  initialAverage?: number;
  initialCount?: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [average, setAverage] = useState(initialAverage);
  const [count, setCount] = useState(initialCount);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const canReview = Boolean(interactive && sellerId && listingId);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setCurrentUserId(user?.id ?? null);

      if (!sellerId) {
        return;
      }

      const { data } = await supabase
        .from("seller_reviews")
        .select("rating")
        .eq("seller_id", sellerId);

      if (!mounted || !data) {
        return;
      }

      const ratings = data
        .map((item) => Number(item.rating))
        .filter((item) => Number.isFinite(item));

      setCount(ratings.length);
      setAverage(
        ratings.length
          ? ratings.reduce((sum, item) => sum + item, 0) / ratings.length
          : 0,
      );
    }

    load();

    return () => {
      mounted = false;
    };
  }, [sellerId, supabase]);

  async function handleOpen() {
    setMessage("");

    if (!canReview) {
      return;
    }

    if (!currentUserId) {
      setMessage("Влез в профила си, за да оставиш оценка.");
      return;
    }

    if (currentUserId === sellerId) {
      setMessage("Не можеш да оцениш собствената си обява.");
      return;
    }

    const { data } = await supabase
      .from("seller_reviews")
      .select("id,rating,comment")
      .eq("seller_id", sellerId)
      .eq("reviewer_id", currentUserId)
      .eq("listing_id", listingId)
      .maybeSingle<ReviewRow>();

    if (data) {
      setRating(data.rating);
      setComment(data.comment ?? "");
    } else {
      setRating(5);
      setComment("");
    }

    setOpen(true);
  }

  async function refreshAverage() {
    if (!sellerId) {
      return;
    }

    const { data } = await supabase
      .from("seller_reviews")
      .select("rating")
      .eq("seller_id", sellerId);

    const ratings = (data ?? [])
      .map((item) => Number(item.rating))
      .filter((item) => Number.isFinite(item));

    setCount(ratings.length);
    setAverage(
      ratings.length
        ? ratings.reduce((sum, item) => sum + item, 0) / ratings.length
        : 0,
    );
  }

  async function saveReview() {
    setMessage("");

    if (!currentUserId || !sellerId || !listingId) {
      setMessage("Влез в профила си, за да оставиш оценка.");
      return;
    }

    if (currentUserId === sellerId) {
      setMessage("Не можеш да оцениш собствената си обява.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setMessage("Оценката трябва да бъде между 1 и 5.");
      return;
    }

    setSaving(true);

    const payload = {
      seller_id: sellerId,
      reviewer_id: currentUserId,
      listing_id: listingId,
      rating,
      comment: comment.trim() || null,
    };

    const { data: existing } = await supabase
      .from("seller_reviews")
      .select("id")
      .eq("seller_id", sellerId)
      .eq("reviewer_id", currentUserId)
      .eq("listing_id", listingId)
      .maybeSingle<{ id: string }>();

    const { error } = existing?.id
      ? await supabase
          .from("seller_reviews")
          .update({ rating: payload.rating, comment: payload.comment })
          .eq("id", existing.id)
          .eq("reviewer_id", currentUserId)
      : await supabase.from("seller_reviews").insert(payload);

    setSaving(false);

    if (error) {
      setMessage(
        error.message.includes("seller_reviews")
          ? "Отзивите още не са настроени в базата данни."
          : `Не успяхме да запазим оценката: ${error.message}`,
      );
      return;
    }

    await refreshAverage();
    setOpen(false);
  }

  const label = compact
    ? `★ ${average.toFixed(1)}`
    : `★ ${average.toFixed(1)} (${count} ${count === 1 ? "отзив" : "отзива"})`;

  const content = (
    <>
      <Star
        size={compact ? 12 : 15}
        className="shrink-0 text-amber-400"
        fill="currentColor"
      />
      <span>{label.replace("★ ", "")}</span>
    </>
  );

  return (
    <>
      {interactive ? (
        <button
          type="button"
          onClick={handleOpen}
          className={
            compact
              ? "inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-amber-700"
              : "inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-800"
          }
        >
          {content}
        </button>
      ) : (
        <span
          className={
            compact
              ? "inline-flex items-center gap-1 text-xs font-semibold text-slate-500"
              : "inline-flex items-center gap-1 text-sm font-bold text-slate-600"
          }
        >
          {content}
        </span>
      )}

      {message ? (
        <span className="block text-xs font-semibold text-red-600">{message}</span>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-100 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black">Оцени продавача</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Затвори"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded-md p-1 text-amber-400 hover:bg-amber-50 active:scale-95"
                  aria-label={`Оценка ${value}`}
                >
                  <Star
                    size={28}
                    fill={value <= rating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-bold">Коментар по желание</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                maxLength={1000}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                placeholder="Напиши кратък отзив за продавача."
              />
            </label>

            {message ? (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {message}
              </p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Отказ
              </button>
              <button
                type="button"
                onClick={saveReview}
                disabled={saving}
                className="rounded-md bg-amber-500 px-4 py-2 text-sm font-black text-white hover:bg-amber-600 disabled:opacity-60"
              >
                {saving ? "Запазване..." : "Запази оценката"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
