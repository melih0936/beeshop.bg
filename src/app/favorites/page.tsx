"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import ListingCard from "@/components/ListingCard";
import SiteFooter from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase-client";
import { isActiveListing, type Listing } from "@/lib/marketplace";

export default function FavoritesPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadFavorites() {
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

      const { data, error } = await supabase
        .from("favorites")
        .select("listing_id,listings(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!mounted) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
      } else {
        const favoriteListings = (data ?? [])
          .flatMap((row) => row.listings ?? [])
          .filter((listing) => {
            const item = listing as unknown as Listing;
            return item.moderation_status === "approved" && isActiveListing(item);
          }) as unknown as Listing[];

        setListings(favoriteListings);
      }

      setLoading(false);
    }

    loadFavorites();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  return (
    <main
      className="min-h-screen bg-cover bg-fixed bg-center text-slate-950"
      style={{ backgroundImage: "url('/bee-background.png')" }}
    >
      <div className="min-h-screen bg-white/70">
        <Header />
        <div className="mx-auto max-w-6xl px-3 py-4 md:px-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight">Любими</h1>
              <p className="mt-1 text-sm text-slate-600">
                Запазени обяви от твоя профил.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/95 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Обяви
            </Link>
          </div>

          {loading ? (
            <section className="rounded-lg border border-slate-200 bg-white/95 p-5 text-sm font-semibold shadow-sm">
              Зареждане...
            </section>
          ) : errorMessage ? (
            <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
              {errorMessage}
            </section>
          ) : listings.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Нямаш любими обяви"
              description="Запази обява със сърцето, за да я намериш по-късно."
              actionHref="/"
              actionLabel="Към обявите"
            />
          ) : (
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </section>
          )}
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
