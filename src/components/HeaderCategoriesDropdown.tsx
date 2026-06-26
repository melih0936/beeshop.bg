"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";
import { categories } from "@/lib/marketplace";

export default function HeaderCategoriesDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 hover:text-amber-700"
      >
        Категории
        <ChevronDown size={14} />
      </button>

      {open ? (
        <div className="pointer-events-auto absolute left-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/?category=${encodeURIComponent(category)}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800"
            >
              <CategoryIcon category={category} />
              {category}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
