import Link from "next/link";
import { Menu } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";
import { categories, categoryTree } from "@/lib/marketplace";

export default function MobileCategories({
  activeCategory,
  activeSubcategory,
}: {
  activeCategory?: string;
  activeSubcategory?: string;
}) {
  return (
    <details className="rounded-xl border border-amber-100 bg-white/95 p-3 shadow-sm ring-1 ring-white/70 backdrop-blur lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-black text-slate-950">
        <span className="inline-flex items-center gap-2">
          <Menu size={18} />
          Категории
        </span>
        <span className="text-xs font-semibold text-slate-500">
          {activeSubcategory || activeCategory || "Всички"}
        </span>
      </summary>
      <div className="mt-3 space-y-2">
        <Link
          href="/"
          className={`block rounded-lg px-3 py-2.5 text-sm font-bold ${
            !activeCategory ? "bg-amber-100 text-amber-900" : "bg-slate-50"
          }`}
        >
          Всички
        </Link>
        {categories.map((category) => {
          const isActive = activeCategory === category;
          const subcategories = categoryTree[category] ?? [];

          return (
            <div key={category} className="rounded-lg bg-slate-50">
              <Link
                href={`/?category=${encodeURIComponent(category)}`}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold ${
                  isActive
                    ? "bg-amber-100 text-amber-900"
                    : "text-slate-700"
                }`}
              >
                <CategoryIcon category={category} />
                {category}
              </Link>
              {isActive && subcategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                  {subcategories.map((subcategory) => (
                    <Link
                      key={subcategory}
                      href={`/?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`}
                      className={`rounded-md px-2 py-1.5 text-xs font-bold ${
                        activeSubcategory === subcategory
                          ? "bg-white text-amber-900 shadow-sm"
                          : "text-slate-600"
                      }`}
                    >
                      {subcategory}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </details>
  );
}
