export type Listing = {
  id: string;
  title: string;
  description: string | null;
  price: number | string | null;
  category: string;
  subcategory?: string | null;
  region: string;
  city?: string | null;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  seller_name: string;
  seller_phone: string;
  babh_registration_number?: string | null;
  image_url: string | null;
  is_vip: boolean;
  moderation_status?: "approved" | "review" | "rejected";
  moderation_reason?: string | null;
  moderation_confidence?: number | string | null;
  moderated_at?: string | null;
  created_at: string;
  expires_at?: string | null;
  is_negotiable?: boolean | null;
  user_id?: string | null;
  seller_is_verified?: boolean | null;
};

export type ListingImage = {
  id: string;
  listing_id: string;
  url: string;
  path: string | null;
  sort_order: number;
  created_at: string;
};

export type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
};

export type Favorite = {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
};

export const MAX_LISTING_IMAGES = 5;

export const categories = [
  "Мед",
  "Пчелни семейства",
  "Пчелни майки",
  "Кошери",
  "Инвентар",
  "Восък",
  "Услуги",
  "Изкупуване",
] as const;

export const categoryTree: Record<string, string[]> = {
  Мед: [
    "Липов мед",
    "Манов мед",
    "Акациев мед",
    "Рапица",
    "Слънчоглед",
    "Смесен букет",
    "Медни пити",
    "Пчелни продукти",
    "Прашец",
    "Прополис",
    "Пчелно млечице",
    "Други",
  ],
  "Пчелни семейства": [
    "Семейства",
    "Отводки - ДБ",
    "Отводки - ЛР",
    "Отводки - Фарар",
    "Роеве",
    "Нуклеуси",
    "Други",
  ],
  "Пчелни майки": [
    "Карника",
    "Бъкфаст",
    "Местна",
    "Оплодени майки",
    "Неоплодени майки",
    "Други",
  ],
  Кошери: ["ДБ", "ЛР", "Магазини", "Фарар", "Дъна", "Капаци", "Нуклеуси", "Други"],
  Инвентар: [
    "Центрофуги",
    "Рамки",
    "Основи",
    "Хранилки",
    "Пушалки",
    "Инструменти",
    "Предпазно облекло",
    "Друг инвентар",
  ],
  Восък: ["Восък", "Восъчни основи", "Претопяване", "Други"],
  Услуги: ["Транспорт на кошери", "Опрашване", "Помощ в пчелин", "Ремонт на кошери", "Други"],
  Изкупуване: ["Купувам мед", "Купувам восък", "Купувам кошери", "Купувам инвентар", "Други"],
};

export const regions = [
  "Благоевград",
  "Бургас",
  "Варна",
  "Велико Търново",
  "Видин",
  "Враца",
  "Габрово",
  "Добрич",
  "Кърджали",
  "Кюстендил",
  "Ловеч",
  "Монтана",
  "Пазарджик",
  "Перник",
  "Плевен",
  "Пловдив",
  "Разград",
  "Русе",
  "Силистра",
  "Сливен",
  "Смолян",
  "София-град",
  "София-област",
  "Стара Загора",
  "Търговище",
  "Хасково",
  "Шумен",
  "Ямбол",
] as const;

export const allRegionsLabel = "Всички области";

export function formatPrice(
  price: Listing["price"],
  isNegotiable?: boolean | null,
) {
  if (isNegotiable || price === null || price === undefined || price === "") {
    return "По договаряне";
  }

  const numericPrice = typeof price === "number" ? price : Number(price);

  if (Number.isNaN(numericPrice)) {
    return "По договаряне";
  }

  return new Intl.NumberFormat("bg-BG", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(numericPrice);
}

export function validateListingImage(file: File) {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  const allowedExtensions = ["png", "jpg", "jpeg", "webp"];
  const maxBytes = 10 * 1024 * 1024;
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  if (
    !allowedTypes.includes(file.type) ||
    !allowedExtensions.includes(extension)
  ) {
    return "Качи снимка във формат PNG, JPG или WebP.";
  }

  if (file.size > maxBytes) {
    return "Снимката трябва да е до 10MB.";
  }

  return "";
}

export function validateMessageAttachment(file: File) {
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "application/pdf",
  ];
  const allowedExtensions = ["png", "jpg", "jpeg", "webp", "pdf"];
  const maxBytes = 10 * 1024 * 1024;
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  if (
    !allowedTypes.includes(file.type) ||
    !allowedExtensions.includes(extension)
  ) {
    return "Позволени са JPG, PNG, WebP или PDF файлове.";
  }

  if (file.size > maxBytes) {
    return "Файлът трябва да е до 10MB.";
  }

  return "";
}

export function sanitizeText(value: string, maxLength = 2000) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function isActiveListing(listing: Listing) {
  return !listing.expires_at || new Date(listing.expires_at) > new Date();
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
