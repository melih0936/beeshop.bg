"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, ShieldX } from "lucide-react";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase-client";
import { formatDate, type Listing } from "@/lib/marketplace";

export default function AdminModerationPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const loadListings = useCallback(async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("moderation_status", "review")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setListings((data ?? []) as Listing[]);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const allowed = isAdminEmail(user?.email);

      if (!mounted) {
        return;
      }

      setIsAdmin(allowed);

      if (allowed) {
        await loadListings();
      }

      if (mounted) {
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [loadListings, supabase]);

  async function updateStatus(
    listingId: string,
    status: "approved" | "rejected",
  ) {
    setErrorMessage("");
    const { error } = await supabase
      .from("listings")
      .update({
        moderation_status: status,
        moderated_at: new Date().toISOString(),
      })
      .eq("id", listingId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setListings((items) => items.filter((listing) => listing.id !== listingId));
  }

  return (
    <main
      className="min-h-screen bg-cover bg-fixed bg-center text-slate-950"
      style={{ backgroundImage: "url('/bee-background.png')" }}
    >
      <div className="min-h-screen bg-gradient-to-b from-white/80 via-amber-50/55 to-white/80">
        <Header />
        <div className="mx-auto max-w-5xl px-4 py-6">
          <section className="rounded-2xl border border-amber-100 bg-white/95 p-5 shadow-sm ring-1 ring-white/80 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black tracking-tight">
                  Модерация на обяви
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Обяви, изпратени за ръчна проверка.
                </p>
              </div>
              <Link
                href="/"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Към обявите
              </Link>
            </div>

            {loading ? (
              <p className="mt-5 text-sm font-semibold text-slate-600">
                Зареждане...
              </p>
            ) : !isAdmin ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                Нямаш достъп до тази страница.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {errorMessage ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                {listings.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-600">
                    Няма обяви, чакащи проверка.
                  </div>
                ) : (
                  listings.map((listing) => (
                    <article
                      key={listing.id}
                      className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-lg font-black">
                            {listing.title}
                          </h2>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {listing.category}
                            {listing.subcategory
                              ? ` / ${listing.subcategory}`
                              : ""}{" "}
                            · {formatDate(listing.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateStatus(listing.id, "approved")}
                            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 active:scale-[0.98]"
                          >
                            <ShieldCheck size={16} />
                            Одобри
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(listing.id, "rejected")}
                            className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100 active:scale-[0.98]"
                          >
                            <ShieldX size={16} />
                            Отхвърли
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                        {listing.description}
                      </p>
                      <div className="mt-3 rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                        <p>
                          <strong>Продавач:</strong> {listing.seller_name}
                        </p>
                        <p>
                          <strong>Причина:</strong>{" "}
                          {listing.moderation_reason || "Чака проверка."}
                        </p>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
