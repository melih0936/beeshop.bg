import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      {Icon ? <Icon className="mx-auto text-amber-500" /> : null}
      <h3 className="mt-3 text-base font-bold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex rounded-md bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
