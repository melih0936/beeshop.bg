import Link from "next/link";
import { Star } from "lucide-react";
import CategorySidebar from "@/components/CategorySidebar";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import ListingCard from "@/components/ListingCard";
import MobileCategories from "@/components/MobileCategories";
import SearchBar from "@/components/SearchBar";
import SiteFooter from "@/components/SiteFooter";
import { supabase } from "@/lib/supabase";
import { allRegionsLabel, type Listing } from "@/lib/marketplace";

type HomeSearchParams = Promise<{
  q?: string;
  region?: string;
  category?: string;
  subcategory?: string;
  page?: string;
}>;

const LISTINGS_PER_PAGE = 20;

type FilterableListingRequest = {
  eq(column: string, value: string): FilterableListingRequest;
  or(filters: string): FilterableListingRequest;
};

function applyListingFilters<T>(
  request: T,
  filters: {
    query?: string;
    region?: string;
    category?: string;
    subcategory?: string;
  },
): T {
  let nextRequest = (request as unknown as FilterableListingRequest)
    .eq("moderation_status", "approved")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (filters.category) {
    nextRequest = nextRequest.eq("category", filters.category);
  }

  if (filters.subcategory) {
    nextRequest = nextRequest.eq("subcategory", filters.subcategory);
  }

  if (filters.region && filters.region !== allRegionsLabel) {
    nextRequest = nextRequest.eq("region", filters.region);
  }

  const term = filters.query?.trim();

  if (term) {
    const cleanTerm = term.replace(/[%_,]/g, "");
    nextRequest = nextRequest.or(
      [
        `title.ilike.%${cleanTerm}%`,
        `description.ilike.%${cleanTerm}%`,
        `category.ilike.%${cleanTerm}%`,
        `subcategory.ilike.%${cleanTerm}%`,
        `city.ilike.%${cleanTerm}%`,
      ].join(","),
    );
  }

  return nextRequest as unknown as T;
}

async function getTopListings(filters: {
  query?: string;
  region?: string;
  category?: string;
  subcategory?: string;
}) {
  const request = applyListingFilters(
    supabase.from("listings").select("*").eq("is_vip", true),
    filters,
  )
    .order("created_at", { ascending: false })
    .limit(4);

  const { data, error } = await request;

  if (error) {
    console.warn("Supabase query failed", { message: error.message, details: error.details, hint: error.hint, code: error.code });
    return [] as Listing[];
  }

  return (data ?? []) as Listing[];
}

async function getPagedListings(filters: {
  query?: string;
  region?: string;
  category?: string;
  subcategory?: string;
  page: number;
  excludeIds: string[];
}) {
  const from = (filters.page - 1) * LISTINGS_PER_PAGE;
  const to = from + LISTINGS_PER_PAGE - 1;
  let request = applyListingFilters(
    supabase.from("listings").select("*", { count: "exact" }),
    filters,
  );

  if (filters.excludeIds.length > 0) {
    request = request.not("id", "in", `(${filters.excludeIds.join(",")})`);
  }

  const { data, error, count } = await request
    .order("is_vip", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.warn("Supabase query failed", { message: error.message, details: error.details, hint: error.hint, code: error.code });
    return { listings: [] as Listing[], count: 0 };
  }

  return {
    listings: (data ?? []) as Listing[],
    count: count ?? 0,
  };
}

function buildPageHref(
  params: {
    query?: string;
    region?: string;
    category?: string;
    subcategory?: string;
  },
  page: number,
) {
  const search = new URLSearchParams();

  if (params.query) search.set("q", params.query);
  if (params.region) search.set("region", params.region);
  if (params.category) search.set("category", params.category);
  if (params.subcategory) search.set("subcategory", params.subcategory);

  search.set("page", String(page));
  return `/?${search.toString()}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const region = typeof params.region === "string" ? params.region : "";
  const category = typeof params.category === "string" ? params.category : "";
  const subcategory =
    typeof params.subcategory === "string" ? params.subcategory : "";
  const currentPage = Math.max(1, Number(params.page || "1") || 1);
  const topListings = await getTopListings({
    query,
    region,
    category,
    subcategory,
  });
  const { listings: newestListings, count: totalListings } =
    await getPagedListings({
      query,
      region,
      category,
      subcategory,
      page: currentPage,
      excludeIds: topListings.map((listing) => listing.id),
    });
  const totalPages = Math.max(1, Math.ceil(totalListings / LISTINGS_PER_PAGE));

  return (
    <main
      className="min-h-screen bg-cover bg-fixed bg-center text-slate-950"
      style={{ backgroundImage: "url('/bee-background.png')" }}
    >
      <div className="min-h-screen bg-gradient-to-b from-white/80 via-amber-50/55 to-white/80">
        <Header />

        <div className="mx-auto grid max-w-[1440px] gap-5 px-3 py-5 md:px-5 lg:grid-cols-[238px_minmax(0,1fr)]">
          <CategorySidebar
            activeCategory={category}
            activeSubcategory={subcategory}
          />

          <section className="space-y-4">
            <MobileCategories
              activeCategory={category}
              activeSubcategory={subcategory}
            />

            <SearchBar query={query} region={region} category={category} />

            {topListings.length > 0 ? (
              <section
                id="top-listings"
                className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white via-white to-amber-50/80 p-4 shadow-sm ring-1 ring-white/80 backdrop-blur"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black text-slate-950">
                    Топ обяви
                  </h2>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900">
                    {topListings.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                  {topListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-amber-100 bg-white/95 p-4 shadow-sm ring-1 ring-white/80 backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Най-нови обяви
                  </h2>
                  <p className="text-sm text-slate-600">
                    Последно публикувани обяви, подредени по дата.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                  {totalListings} резултата
                </span>
              </div>

              {newestListings.length === 0 ? (
                <EmptyState
                  icon={Star}
                  title="Няма намерени обяви"
                  description="Промени търсенето или публикувай първата обява в тази категория."
                  actionHref="/post"
                  actionLabel="Пусни обява"
                />
              ) : (
                <div className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                  {newestListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}

              {totalListings > LISTINGS_PER_PAGE ? (
                <nav className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-amber-100 pt-4">
                  <Link
                    href={buildPageHref(
                      { query, region, category, subcategory },
                      currentPage - 1,
                    )}
                    aria-disabled={currentPage === 1}
                    className={`rounded-lg border px-4 py-2 text-sm font-black ${
                      currentPage === 1
                        ? "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                        : "border-amber-200 bg-white text-slate-800 hover:bg-amber-50"
                    }`}
                  >
                    Предишна
                  </Link>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-black text-slate-700">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                      Страница {currentPage}
                    </span>
                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                      const pageNumber = index + 1;

                      return (
                        <Link
                          key={pageNumber}
                          href={buildPageHref(
                            { query, region, category, subcategory },
                            pageNumber,
                          )}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-black ${
                            pageNumber === currentPage
                              ? "border-amber-400 bg-amber-500 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-amber-50"
                          }`}
                        >
                          {pageNumber}
                        </Link>
                      );
                    })}
                  </div>
                  <Link
                    href={buildPageHref(
                      { query, region, category, subcategory },
                      currentPage + 1,
                    )}
                    aria-disabled={currentPage >= totalPages}
                    className={`rounded-lg border px-4 py-2 text-sm font-black ${
                      currentPage >= totalPages
                        ? "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                        : "border-amber-200 bg-white text-slate-800 hover:bg-amber-50"
                    }`}
                  >
                    Следваща
                  </Link>
                </nav>
              ) : null}
            </section>
          </section>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}

