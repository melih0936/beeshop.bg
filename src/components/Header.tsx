import Link from "next/link";
import { PlusCircle } from "lucide-react";
import AdminHeaderLink from "@/components/AdminHeaderLink";
import AuthMenu from "@/components/AuthMenu";
import FavoritesHeaderLink from "@/components/FavoritesHeaderLink";
import HeaderCategoriesDropdown from "@/components/HeaderCategoriesDropdown";
import HeaderSearch from "@/components/HeaderSearch";
import MessagesButton from "@/components/MessagesButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-200/70 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-3 py-3 md:px-5">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 md:gap-3"
          aria-label="BeeShop.bg - Начало"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-100 shadow-sm ring-2 ring-amber-200 md:h-14 md:w-14">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bees-bg.png"
              alt="BeeShop.bg"
              className="h-full w-full object-cover"
            />
          </span>

          <span className="min-w-0 max-[380px]:hidden">
            <span
              className="block truncate bg-gradient-to-r from-slate-950 via-amber-900 to-amber-600 bg-clip-text text-[21px] font-black leading-6 tracking-tight text-transparent md:text-[27px]"
              style={{
                fontFamily:
                  '"Trebuchet MS", "Segoe UI", "Arial Rounded MT Bold", Arial, sans-serif',
              }}
            >
              BeeShop.bg
            </span>
            <span className="hidden truncate text-xs font-semibold text-slate-500 sm:block">
              Пчеларски обяви и мед от България
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold text-slate-700 lg:flex">
          <Link href="/" className="transition hover:text-amber-700">
            Начало
          </Link>

          <HeaderCategoriesDropdown />

          <Link href="/#top-listings" className="transition hover:text-amber-700">
            Топ обяви
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <HeaderSearch />
          </div>

          <MessagesButton />
          <FavoritesHeaderLink />
          <AdminHeaderLink />

          <Link
            href="/post"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-2.5 text-xs font-black text-white shadow-sm transition hover:bg-amber-600 active:scale-[0.98] sm:gap-2 sm:px-3 sm:text-sm md:px-4"
            aria-label="Пусни обява"
            title="Пусни обява"
          >
            <PlusCircle size={16} className="shrink-0" />
            <span className="whitespace-nowrap">Пусни обява</span>
          </Link>

          <AuthMenu />
        </div>
      </div>

      <div className="border-t border-amber-100 bg-amber-50/70 px-3 py-2 sm:hidden">
        <HeaderSearch />
      </div>
    </header>
  );
}
