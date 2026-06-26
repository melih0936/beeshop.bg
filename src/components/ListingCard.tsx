import Link from "next/link";
import { BadgeCheck, Crown, MapPin, ShieldCheck } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import CategoryIcon from "@/components/CategoryIcon";
import ListingCardImageCarousel from "@/components/ListingCardImageCarousel";
import SellerRatingSummary from "@/components/SellerRatingSummary";
import { SellerPhoneButton } from "@/components/SellerPhone";
import { formatPrice, type Listing } from "@/lib/marketplace";

export default function ListingCard({ listing }: { listing: Listing }) {
  const listingHref = `/listings/${listing.id}`;

  return (
    <article className="group flex h-full min-h-[310px] flex-col overflow-hidden rounded-xl border border-amber-100/80 bg-white shadow-sm ring-1 ring-white/70 transition duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg sm:min-h-[372px]">
      <div className="relative">
        <ListingCardImageCarousel
          listingId={listing.id}
          listingHref={listingHref}
          title={listing.title}
          fallbackImageUrl={listing.image_url}
          className="h-28 sm:h-40"
        />

        {listing.is_vip ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-slate-950/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            <Crown size={12} />
            Топ
          </span>
        ) : null}

        {listing.babh_registration_number ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2 py-1 text-[11px] font-bold text-white shadow-sm">
            <ShieldCheck size={12} />
            БАБХ
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
        <div className="flex items-center justify-between gap-1.5 text-[11px] sm:gap-2 sm:text-xs">
          <span className="inline-flex min-w-0 items-center gap-1 truncate rounded-full bg-amber-50 px-1.5 py-1 font-bold text-amber-800 sm:gap-1.5 sm:px-2">
            <CategoryIcon
              category={listing.category}
              className="h-3.5 w-3.5 shrink-0"
            />
            {listing.category}
          </span>

          <span className="inline-flex min-w-0 items-center gap-1 font-semibold text-slate-500">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{listing.region}</span>
          </span>
        </div>

        <Link href={listingHref} className="block hover:text-amber-700">
          <h3 className="mt-2 line-clamp-2 min-h-9 text-[13px] font-black leading-[18px] text-slate-950 sm:mt-3 sm:min-h-10 sm:text-[15px] sm:leading-5">
            {listing.title}
          </h3>
        </Link>

        <Link href={listingHref} className="block">
          <p className="mt-1.5 line-clamp-2 min-h-8 text-[11px] leading-4 text-slate-600 sm:min-h-9 sm:text-xs sm:leading-[18px]">
            {listing.description || "Без описание."}
          </p>
        </Link>

        <div className="mt-auto flex items-center justify-between gap-1.5 pt-2 sm:gap-2 sm:pt-3">
          <p className="truncate text-sm font-black text-amber-700 sm:text-lg">
            {formatPrice(listing.price, listing.is_negotiable)}
          </p>

          <div className="flex shrink-0 items-center gap-1">
            <FavoriteButton listingId={listing.id} compact />
            <SellerPhoneButton phone={listing.seller_phone} compact />
          </div>
        </div>

        <div className="mt-2 border-t border-amber-50 pt-2 text-[11px] sm:mt-3 sm:text-xs">
          <span className="block truncate font-semibold text-slate-500">
            Продавач: {listing.seller_name}
          </span>

          {listing.seller_is_verified ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-black text-emerald-700">
              <BadgeCheck size={12} />
              Проверен пчелар
            </span>
          ) : null}

          <SellerRatingSummary
            sellerId={listing.user_id}
            listingId={listing.id}
            compact
          />
        </div>
      </div>
    </article>
  );
}