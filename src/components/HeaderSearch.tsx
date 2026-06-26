"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export default function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setOpen(false);
      return;
    }

    router.push(`/?q=${encodeURIComponent(cleanQuery)}`);
    setOpen(false);
  }

  return (
    <div className="relative z-50 shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative z-50 inline-flex h-10 w-10 touch-manipulation items-center justify-center rounded-lg border border-amber-200/80 bg-white text-slate-700 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 active:scale-[0.98]"
        aria-label="Търсене"
        title="Търсене"
      >
        {open ? <X size={17} /> : <Search size={17} />}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Затвори търсенето"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-transparent"
          />

          <form
            onSubmit={submit}
            className="fixed left-3 right-3 top-20 z-50 flex items-center gap-2 rounded-xl border border-amber-200 bg-white p-3 shadow-2xl md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-[340px]"
          >
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              placeholder="Търси обяви..."
              className="min-w-0 flex-1 text-base outline-none md:text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-black text-white"
            >
              Търси
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}