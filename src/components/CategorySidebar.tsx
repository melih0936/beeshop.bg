import Link from "next/link";
import { ChevronRight } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";
import { categories, categoryTree } from "@/lib/marketplace";

export default function CategorySidebar({
  activeCategory,
  activeSubcategory,
}: {
  activeCategory?: string;
  activeSubcategory?: string;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[84px] rounded-xl border border-amber-100 bg-white/95 p-3 shadow-sm ring-1 ring-white/70 backdrop-blur">
        <h2 className="px-2 pb-2 text-sm font-black uppercase tracking-wide text-amber-800">
          Категории
        </h2>
        <nav className="space-y-1">
          <Link
            href="/"
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold transition ${
              !activeCategory
                ? "bg-amber-100 text-amber-900 shadow-sm"
                : "text-slate-700 hover:bg-amber-50"
            }`}
          >
            Всички обяви
            <ChevronRight size={15} />
          </Link>
          {categories.map((category) => {
            const subcategories = categoryTree[category] ?? [];
            const isActive = activeCategory === category;

            return (
              <div key={category}>
                <Link
                  href={`/?category=${encodeURIComponent(category)}`}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                    isActive
                      ? "bg-amber-100 text-amber-900 shadow-sm"
                      : "text-slate-700 hover:bg-amber-50"
                  }`}
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <CategoryIcon category={category} />
                    {category}
                  </span>
                  <ChevronRight
                    size={15}
                    className={`shrink-0 transition ${isActive ? "rotate-90" : ""}`}
                  />
                </Link>

                {isActive && subcategories.length > 0 ? (
                  <div className="ml-4 mt-1 space-y-1 border-l border-amber-100 pl-2">
                    {subcategories.map((subcategory) => (
                      <Link
                        key={subcategory}
                        href={`/?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`}
                        className={`block rounded-md px-2 py-1.5 text-xs font-bold transition ${
                          activeSubcategory === subcategory
                            ? "bg-amber-50 text-amber-900"
                            : "text-slate-600 hover:bg-amber-50 hover:text-amber-800"
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
        </nav>
      </div>
    </aside>
  );
}
