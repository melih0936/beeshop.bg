import { Search } from "lucide-react";
import { allRegionsLabel, regions } from "@/lib/marketplace";

export default function SearchBar({
  query,
  region,
  category,
}: {
  query?: string;
  region?: string;
  category?: string;
}) {
  return (
    <form
      action="/"
      className="grid gap-2 rounded-xl border border-amber-100 bg-white/95 p-3 shadow-sm ring-1 ring-white/70 backdrop-blur md:grid-cols-[minmax(0,1fr)_220px_120px]"
    >
      {category ? <input type="hidden" name="category" value={category} /> : null}
      <label className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-gradient-to-r from-white to-amber-50/60 px-3 py-2.5 transition focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100">
        <Search size={18} className="shrink-0 text-amber-600" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Търси мед, кошери, майки..."
          className="w-full min-w-0 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
        />
      </label>
      <select
        name="region"
        defaultValue={region || allRegionsLabel}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
      >
        <option>{allRegionsLabel}</option>
        {regions.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <button className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300 active:scale-[0.98]">
        Търси
      </button>
    </form>
  );
}
