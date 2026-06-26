import {
  Boxes,
  CircleDot,
  Handshake,
  Hexagon,
  Package,
  ShoppingBag,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Мед: Package,
  "Пчелни семейства": Hexagon,
  "Пчелни майки": CircleDot,
  Кошери: Hexagon,
  Инвентар: Wrench,
  Восък: CircleDot,
  Услуги: Truck,
  Изкупуване: Handshake,
};

export default function CategoryIcon({
  category,
  className = "h-4 w-4",
}: {
  category: string;
  className?: string;
}) {
  const Icon = iconMap[category] || Boxes;

  return <Icon className={className} aria-hidden="true" />;
}

export function CategoryIconBadge({ category }: { category: string }) {
  const Icon = iconMap[category] || ShoppingBag;

  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
      <Icon size={15} aria-hidden="true" />
    </span>
  );
}
