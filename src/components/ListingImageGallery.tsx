"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase-client";

type GalleryImage = {
  id: string;
  url: string;
  sort_order?: number | null;
};

function uniqueImages(images: GalleryImage[]) {
  const seen = new Set<string>();

  return images.filter((image) => {
    if (!image.url || seen.has(image.url)) {
      return false;
    }

    seen.add(image.url);
    return true;
  });
}

export default function ListingImageGallery({
  listingId,
  title,
  images,
  isVip,
}: {
  listingId?: string;
  title: string;
  images: GalleryImage[];
  isVip?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(
    uniqueImages(images.filter((image) => Boolean(image.url))),
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

      const rows = ((data ?? []) as GalleryImage[]).filter((image) =>
        Boolean(image.url),
      );

      const merged = uniqueImages([
        ...rows,
        ...images.filter((image) => Boolean(image.url)),
      ]);

      if (merged.length > 0) {
        setGalleryImages(merged);
      }
    }

    loadImages();

    return () => {
      mounted = false;
    };
  }, [images, listingId]);

  function scrollToImage(index: number) {
    const container = scrollRef.current;
    const item = container?.children[index] as HTMLElement | undefined;

    setActiveIndex(index);
    item?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  }

  function handleScroll() {
    const container = scrollRef.current;

    if (!container || container.clientWidth === 0) {
      return;
    }

    const index = Math.round(container.scrollLeft / container.clientWidth);
    setActiveIndex(
      Math.min(Math.max(index, 0), Math.max(galleryImages.length - 1, 0)),
    );
  }

  if (galleryImages.length === 0) {
    return (
      <div className="relative flex h-72 items-center justify-center bg-gradient-to-br from-slate-100 via-white to-amber-50 text-slate-400 md:h-[470px]">
        <div className="text-center">
          <ImageIcon className="mx-auto" size={42} />
          <p className="mt-3 text-sm font-semibold">Няма добавена снимка</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100">
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex h-72 snap-x snap-mandatory overflow-x-auto scroll-smooth md:h-[470px]"
        >
          {galleryImages.map((image, index) => (
            <div
              key={`${image.id}-${image.url}`}
              className="h-full min-w-full snap-center bg-gradient-to-br from-slate-100 via-white to-amber-50"
            >
              <img
                src={image.url}
                alt={`${title} - снимка ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {isVip ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-slate-950/95 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
            <Crown size={14} />
            Топ
          </span>
        ) : null}

        {galleryImages.length > 1 ? (
          <div className="absolute bottom-3 right-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-black text-white shadow-sm">
            {activeIndex + 1}/{galleryImages.length}
          </div>
        ) : null}
      </div>

      {galleryImages.length > 1 ? (
        <div className="border-t border-white/80 bg-white/90 p-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {galleryImages.map((image, index) => (
              <button
                key={`thumb-${image.id}-${image.url}`}
                type="button"
                onClick={() => scrollToImage(index)}
                className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition ${
                  activeIndex === index
                    ? "border-amber-500 shadow-sm"
                    : "border-slate-200 opacity-80"
                }`}
                aria-label={`Покажи снимка ${index + 1}`}
              >
                <img
                  src={image.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>

          <p className="mt-2 text-center text-xs font-semibold text-slate-500 md:hidden">
            Плъзни наляво/надясно, за да видиш всички снимки.
          </p>
        </div>
      ) : null}
    </div>
  );
}