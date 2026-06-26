"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase-client";

type CarouselImage = {
  id: string;
  url: string;
  sort_order?: number | null;
};

function uniqueImages(images: CarouselImage[]) {
  const seen = new Set<string>();

  return images.filter((image) => {
    if (!image.url || seen.has(image.url)) {
      return false;
    }

    seen.add(image.url);
    return true;
  });
}

export default function ListingCardImageCarousel({
  listingId,
  listingHref,
  title,
  fallbackImageUrl,
  className = "h-28 sm:h-40",
}: {
  listingId: string;
  listingHref: string;
  title: string;
  fallbackImageUrl?: string | null;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [images, setImages] = useState<CarouselImage[]>(
    fallbackImageUrl
      ? [
          {
            id: "fallback-main-image",
            url: fallbackImageUrl,
            sort_order: 0,
          },
        ]
      : [],
  );

  useEffect(() => {
    let mounted = true;

    async function loadImages() {
      if (!listingId) {
        return;
      }

      const supabase = createClient();

      const { data, error } = await supabase
        .from("listing_images")
        .select("id,url,sort_order")
        .eq("listing_id", listingId)
        .order("sort_order", { ascending: true });

      if (!mounted || error) {
        return;
      }

      const rows = ((data ?? []) as CarouselImage[]).filter((image) =>
        Boolean(image.url),
      );

      const merged = uniqueImages([
        ...rows,
        ...(fallbackImageUrl
          ? [
              {
                id: "fallback-main-image",
                url: fallbackImageUrl,
                sort_order: 0,
              },
            ]
          : []),
      ]);

      if (merged.length > 0) {
        setImages(merged);
      }
    }

    loadImages();

    return () => {
      mounted = false;
    };
  }, [listingId, fallbackImageUrl]);

  function handleScroll() {
    const container = scrollRef.current;

    if (!container || container.clientWidth === 0) {
      return;
    }

    const index = Math.round(container.scrollLeft / container.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), Math.max(images.length - 1, 0)));
  }

  if (images.length === 0) {
    return (
      <Link
        href={listingHref}
        className={`flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-amber-50 text-slate-400 ${className}`}
        aria-label={title}
      >
        <ImageIcon size={28} />
      </Link>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {images.map((image, index) => (
          <Link
            key={`${image.id}-${image.url}`}
            href={listingHref}
            className="h-full min-w-full snap-center"
            aria-label={`${title} - снимка ${index + 1}`}
          >
            <img
              src={image.url}
              alt={`${title} - снимка ${index + 1}`}
              className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
            />
          </Link>
        ))}
      </div>

      {images.length > 1 ? (
        <>
          <div className="absolute bottom-2 right-2 rounded-full bg-slate-950/80 px-2 py-1 text-[11px] font-black text-white shadow-sm">
            {activeIndex + 1}/{images.length}
          </div>

          <div className="absolute bottom-2 left-2 flex max-w-[60%] gap-1">
            {images.map((image, index) => (
              <span
                key={`dot-${image.id}-${index}`}
                className={`h-1.5 rounded-full transition ${
                  activeIndex === index
                    ? "w-4 bg-white"
                    : "w-1.5 bg-white/55"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}