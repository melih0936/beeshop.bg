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
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-amber-200/80 bg-gradient-to-r from-amber-100/95 via-white/95 to-yellow-50/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-3 py-3 md:gap-3 md:px-5 md:py-3.5">
        <Link href="/" className="relative z-10 flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-100 shadow-md ring-2 ring-white md:h-14 md:w-14">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bees-bg.png"
              alt="BeeShop.bg"
              className="h-full w-full object-cover"
            />
          </span>
          <span className="min-w-0 max-[380px]:hidden">
            <span
              className="block truncate bg-gradient-to-r from-slate-950 via-amber-900 to-amber-600 bg-clip-text text-[21px] font-black leading-6 tracking-[0.01em] text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] md:text-[27px]"
              style={{
                fontFamily:
                  '"Trebuchet MS", "Segoe UI", "Arial Rounded MT Bold", Arial, sans-serif',
              }}
            >
              BeeShop.bg
            </span>
            <span className="hidden truncate text-xs font-medium text-slate-500 sm:block">
              Пчеларски обяви за България
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-bold text-slate-700 lg:flex">
          <Link href="/" className="hover:text-amber-700">
            Обяви
          </Link>
          <Link href="/#top-listings" className="hover:text-amber-700">
            Топ обяви
          </Link>
          <HeaderCategoriesDropdown />
        </nav>

        <div className="relative z-50 flex shrink-0 items-center gap-1 sm:gap-2">
          <HeaderSearch />
          <MessagesButton />
          <FavoritesHeaderLink />
          <AdminHeaderLink />
          <Link
            href="/post"
            className="relative z-50 inline-flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center gap-2 rounded-md bg-amber-500 text-sm font-bold text-white shadow-sm hover:bg-amber-600 active:scale-[0.98] md:w-auto md:px-4 md:py-2.5"            aria-label="Пусни обява"
            title="Пусни обява"
          >
            <PlusCircle size={16} />
            <span className="hidden md:inline">Пусни обява</span>
          </Link>
          <AuthMenu />
        </div>
      </div>
    </header>
  );
}
