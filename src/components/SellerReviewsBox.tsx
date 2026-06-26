import { Star } from "lucide-react";

export default function SellerReviewsBox() {
  return (
    <section className="rounded-2xl border border-amber-100 bg-white/95 p-5 shadow-sm ring-1 ring-white/80 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">Отзиви за продавача</h2>
        <div className="flex text-amber-400" aria-label="Няма рейтинг">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} size={16} />
          ))}
        </div>
      </div>
      <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-600">
        Все още няма отзиви за този продавач.
      </p>
    </section>
  );
}
