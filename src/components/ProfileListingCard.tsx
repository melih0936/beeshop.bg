"use client";

import Link from "next/link";
import { Crown, Edit3, Eye, MapPin } from "lucide-react";
import DeleteListingButton from "@/components/DeleteListingButton";
import ListingCardImageCarousel from "@/components/ListingCardImageCarousel";
import {
  formatDate,
  formatPrice,
  isActiveListing,
  type Listing,
} from "@/lib/marketplace";

export default function ProfileListingCard({ listing }: { listing: Listing }) {
  const isActive = isActiveListing(listing);
  const listingHref = `/listings/${listing.id}`;

  const moderationLabel =
    listing.moderation_status === "review"
      ? "Чака проверка"
      : listing.moderation_status === "rejected"
        ? "Отхвърлена"
        : "Одобрена";

  const moderationClass =
    listing.moderation_status === "review"
      ? "bg-amber-50 text-amber-800"
      : listing.moderation_status === "rejected"
        ? "bg-red-50 text-red-700"
        : "bg-emerald-50 text-emerald-700";

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="relative">
        <ListingCardImageCarousel
          listingId={listing.id}
          listingHref={listingHref}
          title={listing.title}
          fallbackImageUrl={listing.image_url}
          className="h-32"
        />

        {listing.is_vip ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-slate-950 px-2 py-1 text-[11px] font-bold text-white">
            <Crown size={12} />
            Топ
          </span>
        ) : null}
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5">
          {listing.title}
        </h3>

        <p className="mt-2 text-base font-black text-amber-700">
          {formatPrice(listing.price, listing.is_negotiable)}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{listing.region}</span>
          </span>

          <span>{formatDate(listing.created_at)}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md px-2 py-1 text-xs font-bold ${
              isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {isActive ? "Активна" : "Изтекла"}
          </span>

          <span
            className={`rounded-md px-2 py-1 text-xs font-bold ${moderationClass}`}
          >
            {moderationLabel}
          </span>

          {!isActive ? (
            <button
              type="button"
              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600"
              title="Скоро"
            >
              Поднови
            </button>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
          <Link
            href={listingHref}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Eye size={14} />
            Виж
          </Link>

          <Link
            href={`/listings/${listing.id}/edit`}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Edit3 size={14} />
            Редакция
          </Link>

          <DeleteListingButton
            listingId={listing.id}
            ownerId={listing.user_id}
            compact
          />
        </div>
      </div>
    </article>
  );
}