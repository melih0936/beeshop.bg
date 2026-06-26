import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import CategoryIcon from "@/components/CategoryIcon";
import Header from "@/components/Header";
import ListingImageGallery from "@/components/ListingImageGallery";
import MessageButton from "@/components/MessageButton";
import OwnerListingActions from "@/components/OwnerListingActions";
import ReportListingButton from "@/components/ReportListingButton";
import { SellerPhoneButton, SellerPhoneText } from "@/components/SellerPhone";
import SellerRatingSummary from "@/components/SellerRatingSummary";
import SiteFooter from "@/components/SiteFooter";
import { supabase } from "@/lib/supabase";
import {
  formatDate,
  formatPrice,
  isActiveListing,
  type ListingImage,
  type Listing,
} from "@/lib/marketplace";

export const dynamic = "force-dynamic";

async function getListing(id: string) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("moderation_status", "approved")
    .single();

  if (error || !data || !isActiveListing(data as Listing)) {
    return null;
  }

  return data as Listing;
}

async function getListingImages(id: string) {
  const { data, error } = await supabase
    .from("listing_images")
    .select("*")
    .eq("listing_id", id)
    .order("sort_order", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as ListingImage[];
}

async function getSellerReviewStats(sellerId?: string | null) {
  if (!sellerId) {
    return { average: 0, count: 0 };
  }

  const { data, error } = await supabase
    .from("seller_reviews")
    .select("rating")
    .eq("seller_id", sellerId);

  if (error || !data) {
    return { average: 0, count: 0 };
  }

  const ratings = data
    .map((item) => Number(item.rating))
    .filter((item) => Number.isFinite(item));

  return {
    average: ratings.length
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0,
    count: ratings.length,
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    notFound();
  }

  const listingImages = await getListingImages(id);
  const galleryImages = [
    ...(listing.image_url
      ? [{ id: "main-image", url: listing.image_url, sort_order: -1 }]
      : []),
    ...listingImages,
  ];
  const reviewStats = await getSellerReviewStats(listing.user_id);
  const isVerifiedBeekeeper = Boolean(
    (listing as Listing & { seller_is_verified?: boolean }).seller_is_verified,
  );

  return (
    <main
      className="min-h-screen bg-cover bg-fixed bg-center text-slate-950"
      style={{ backgroundImage: "url('/bee-background.png')" }}
    >
      <div className="min-h-screen bg-gradient-to-b from-white/80 via-amber-50/55 to-white/80">
        <Header />

        <div className="mx-auto max-w-6xl px-3 py-4 md:px-5">
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-amber-100 bg-white/95 px-3 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-amber-50"
            >
              <ArrowLeft size={16} />
              Назад
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="overflow-hidden rounded-2xl border border-amber-100 bg-white/95 shadow-sm ring-1 ring-white/80 backdrop-blur">
              <ListingImageGallery
                listingId={listing.id}
                title={listing.title}
                images={galleryImages}
                isVip={listing.is_vip}
              />

              <div className="p-5 md:p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 font-bold text-amber-800">
                    <CategoryIcon category={listing.category} className="h-3.5 w-3.5" />
                    {listing.category}
                  </span>
                  {listing.subcategory ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                      {listing.subcategory}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} />
                    {[listing.city, listing.region].filter(Boolean).join(", ") ||
                      listing.region}
                  </span>
                  <span>{formatDate(listing.created_at)}</span>
                </div>

                <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                  {listing.title}
                </h1>

                <p className="mt-3 text-3xl font-black text-amber-700">
                  {formatPrice(listing.price, listing.is_negotiable)}
                </p>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <h2 className="text-base font-black">Описание</h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">
                    {listing.description || "Без описание."}
                  </p>
                </div>

                {listing.expires_at ? (
                  <p className="mt-4 text-xs font-semibold text-slate-500">
                    Активна до: {formatDate(listing.expires_at)}
                  </p>
                ) : null}

                {listing.babh_registration_number ? (
                  <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/90 p-3 text-sm text-emerald-900">
                    <div className="flex items-center gap-2 font-black">
                      <ShieldCheck size={17} />
                      Регистрация към БАБХ: {listing.babh_registration_number}
                    </div>
                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                      Продавачът е въвел регистрационен номер към БАБХ.
                    </p>
                  </div>
                ) : null}

                <p className="mt-5 rounded-md bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                  Продавачът носи отговорност за съдържанието на обявата.
                </p>
              </div>
            </section>

            <aside className="space-y-3">
              <section className="rounded-2xl border border-amber-100 bg-white/95 p-5 shadow-sm ring-1 ring-white/80 backdrop-blur">
                <h2 className="text-lg font-black">Продавач</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <p className="text-base font-bold">{listing.seller_name}</p>
                  {isVerifiedBeekeeper ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
                      <BadgeCheck size={14} />
                      Проверен пчелар
                    </span>
                  ) : null}
                  <SellerRatingSummary
                    sellerId={listing.user_id}
                    listingId={listing.id}
                    initialAverage={reviewStats.average}
                    initialCount={reviewStats.count}
                    interactive
                  />
                </div>
                <SellerPhoneText phone={listing.seller_phone} />

                {listing.babh_registration_number ? (
                  <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/90 p-3 text-xs leading-5 text-emerald-800">
                    <div className="flex items-center gap-2 font-black">
                      <ShieldCheck size={15} />
                      Регистрация към БАБХ
                    </div>
                    <p className="mt-1 font-semibold">
                      {listing.babh_registration_number}
                    </p>
                  </div>
                ) : null}

                {listing.user_id ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Обявата е публикувана от регистриран потребител.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-amber-700">
                    За тази обява няма свързан профил, затова съобщенията са изключени.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-amber-100 bg-white/95 p-5 shadow-sm ring-1 ring-white/80 backdrop-blur">
                <div className="space-y-3">
                  <SellerPhoneButton phone={listing.seller_phone} />
                  <MessageButton
                    listingId={listing.id}
                    sellerId={listing.user_id}
                  />
                  <OwnerListingActions
                    listingId={listing.id}
                    ownerId={listing.user_id}
                  />
                  <FavoriteButton listingId={listing.id} />
                  <Link
                    href="/"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-900 hover:bg-slate-50"
                  >
                    <ArrowLeft size={17} />
                    Назад
                  </Link>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                  <MessageCircle size={15} className="mt-0.5 shrink-0" />
                  Пиши само за конкретната обява и не изпращай чувствителни данни.
                </div>
                <ReportListingButton listingId={listing.id} />
              </section>

            </aside>
          </div>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
