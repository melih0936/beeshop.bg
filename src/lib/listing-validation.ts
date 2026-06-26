type ListingValidationInput = {
  title: string;
  description: string;
  category: string;
  subcategory: string;
};

export type ListingValidationStatus = "APPROVED" | "REVIEW" | "REJECTED";

export const MIN_LISTING_DESCRIPTION_LENGTH = 40;
export const MAX_LISTING_DESCRIPTION_LENGTH = 7000;

export type ListingValidationResult = {
  status: ListingValidationStatus;
  reasons: string[];
  suggestions: string[];
  confidence: number;
};

const babhRequiredTerms = [
  "мед",
  "медни пити",
  "пчелни продукти",
  "отвод",
  "пчелни майки",
  "майк",
  "роев",
  "рой",
  "живи пчелни семейства",
  "пчелни семейства",
  "изкупуване на мед",
  "изкуп",
];

export function isBabhRegistrationRequired(input: {
  category: string;
  subcategory?: string | null;
  title?: string | null;
  description?: string | null;
}) {
  const categoryText = [input.category, input.subcategory || ""]
    .join(" ")
    .toLocaleLowerCase("bg-BG");
  const fullText = [
    input.category,
    input.subcategory || "",
    input.title || "",
    input.description || "",
  ]
    .join(" ")
    .toLocaleLowerCase("bg-BG");
  const foodTerms = [
    "мед",
    "медни пити",
    "пчелни пити",
    "пчелни продукти",
    "прашец",
    "пчелен прашец",
    "прополис",
    "пчелно млечице",
    "honey",
    "propolis",
    "pollen",
    "royal jelly",
  ];
  const nonFoodCategoryTerms = [
    "отвод",
    "пчелни майки",
    "майк",
    "роев",
    "рой",
    "живи пчелни семейства",
    "пчелни семейства",
    "пчели",
    "кошер",
    "нуклеус",
    "рамк",
    "основи",
    "восъчни основи",
    "восък",
    "инвентар",
    "центрофуг",
    "пушал",
    "услуги",
    "транспорт",
    "опрашване",
    "изкуп",
    "купувам",
  ];
  const sellingIntentTerms = ["продавам", "продажба", "предлагам"];
  const hasFoodProduct = foodTerms.some((term) => fullText.includes(term));
  const hasSellingIntent = sellingIntentTerms.some((term) =>
    fullText.includes(term),
  );

  if (
    nonFoodCategoryTerms.some((term) => categoryText.includes(term)) &&
    !categoryText.includes("пчелни продукти") &&
    !(hasFoodProduct && hasSellingIntent)
  ) {
    return false;
  }

  return hasFoodProduct;

  const text = [input.category, input.subcategory || ""]
    .join(" ")
    .toLocaleLowerCase("bg-BG");

  return babhRequiredTerms.some((term) => text.includes(term));
}

const beekeepingTerms = [
  "мед",
  "пчел",
  "кошер",
  "отвод",
  "майк",
  "роев",
  "рой",
  "восък",
  "восъч",
  "прополис",
  "прашец",
  "пчелно млечице",
  "пити",
  "основи",
  "магазин",
  "магазини",
  "хранилк",
  "рамк",
  "центрофуг",
  "пушал",
  "инвентар",
  "пчелин",
  "опраш",
  "изкуп",
  "нектар",
  "акациев",
  "липов",
  "билков",
  "манов",
  "карника",
  "бъкфаст",
  "honey",
  "bee",
  "bees",
  "hive",
  "nuc",
  "queen",
  "wax",
  "propolis",
  "pollen",
  "extractor",
  "smoker",
  "apiary",
];

const strongBeekeepingTerms = [
  "мед",
  "пчел",
  "кошер",
  "отвод",
  "рамк",
  "основи",
  "пити",
  "инвентар",
  "магазин",
  "хранилк",
  "пчелни майки",
  "восък",
  "восъч",
  "прополис",
  "прашец",
  "центрофуг",
  "пушал",
  "пчелин",
  "honey",
  "bee",
  "bees",
  "hive",
  "queen",
  "wax",
  "apiary",
];

const clearApprovalTerms = [
  "мед",
  "акациев мед",
  "липов мед",
  "билков мед",
  "манов мед",
  "пчелни пити",
  "восък",
  "восъчни основи",
  "основи",
  "рамки",
  "пчелни рамки",
  "кошери",
  "кошер",
  "нуклеуси",
  "отводки",
  "пчелни майки",
  "майки карника",
  "майки бъкфаст",
  "роеве",
  "пчелни семейства",
  "центрофуга",
  "пушалка",
  "пчеларски инвентар",
  "хранилки",
  "магазини за кошери",
  "транспорт на кошери",
  "опрашване",
  "изкупуване на мед",
];

const forbiddenTerms = [
  "bmw",
  "mercedes",
  "audi",
  "volkswagen",
  "vw",
  "opel",
  "toyota",
  "honda",
  "ford",
  "peugeot",
  "hdi",
  "tdi",
  "320d",
  "iphone",
  "ipad",
  "macbook",
  "samsung",
  "laptop",
  "phone",
  "computer",
  "forex",
  "crypto",
  "trading",
  "casino",
  "betting",
  "adult",
  "spam",
  "кола",
  "коли",
  "автомобил",
  "автомобили",
  "пежо",
  "дизел",
  "телефон",
  "лаптоп",
  "компютър",
  "апартамент",
  "имот",
  "дрехи",
  "обувки",
  "алкохол",
  "оръжие",
  "казино",
  "залаган",
  "крипто",
  "трейдинг",
  "ерот",
  "спам",
];

const reviewTerms = [
  "бус",
  "ван",
  "ремарке",
  "каравана",
  "земя",
  "нива",
  "парцел",
  "помещение",
  "склад",
  "гараж",
  "транспорт",
  "превоз",
  "услуга",
  "ремонт",
  "наем",
  "truck",
  "van",
  "trailer",
  "land",
  "storage",
  "transport",
  "service",
];

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function validateBeekeepingListing(
  input: ListingValidationInput,
): ListingValidationResult {
  const title = input.title.trim();
  const description = input.description.trim();
  const listingText = [title, description].join(" ").toLocaleLowerCase("bg-BG");
  const fullText = [
    title,
    description,
    input.category,
    input.subcategory,
  ]
    .join(" ")
    .toLocaleLowerCase("bg-BG");
  const reasons: string[] = [];
  const suggestions: string[] = [];
  const hasBeekeepingTopic = includesAny(listingText, beekeepingTerms);
  const hasStrongBeekeepingTopic = includesAny(
    listingText,
    strongBeekeepingTerms,
  );
  const hasForbiddenTopic = includesAny(fullText, forbiddenTerms);
  const hasReviewTopic = includesAny(listingText, reviewTerms);
  const hasClearApprovalTopic = includesAny(fullText, clearApprovalTerms);
  const categoryIsBeekeeping = includesAny(
    [input.category, input.subcategory].join(" ").toLocaleLowerCase("bg-BG"),
    beekeepingTerms,
  );

  if (description.length < MIN_LISTING_DESCRIPTION_LENGTH) {
    reasons.push("Описанието трябва да е поне 40 символа.");
    suggestions.push(
      `Добави поне ${MIN_LISTING_DESCRIPTION_LENGTH} символа: количество, състояние, произход или начин на доставка.`,
    );
  }

  if (description.length > MAX_LISTING_DESCRIPTION_LENGTH) {
    reasons.push("Описанието не може да бъде повече от 7000 символа.");
    suggestions.push("Съкрати описанието до най-важната информация.");
  }

  if (hasForbiddenTopic && !hasBeekeepingTopic) {
    reasons.push(
      "Обявата изглежда за продукт или услуга извън пчеларската тематика.",
    );
    suggestions.push(
      "BeeShop.bg приема само обяви за мед, пчели, кошери, восък, инвентар и пчеларски услуги.",
    );

    return {
      status: "REJECTED",
      reasons,
      suggestions,
      confidence: 0.96,
    };
  }

  if (hasForbiddenTopic && hasBeekeepingTopic) {
    reasons.push(
      "Обявата съдържа смесено съдържание и трябва да бъде прегледана ръчно.",
    );
    suggestions.push(
      "Поясни ясно как продуктът или услугата се използва в пчеларството.",
    );

    return {
      status: "REVIEW",
      reasons,
      suggestions,
      confidence: 0.66,
    };
  }

  if (!hasBeekeepingTopic) {
    reasons.push(
      "Заглавието и описанието не изглеждат свързани с пчеларство.",
    );
    suggestions.push(
      "Опиши ясно какво пчеларско изделие, продукт или услуга предлагаш.",
    );

    return {
      status: "REJECTED",
      reasons,
      suggestions,
      confidence: 0.92,
    };
  }

  if (hasClearApprovalTopic || (categoryIsBeekeeping && hasStrongBeekeepingTopic)) {
    return {
      status: "APPROVED",
      reasons,
      suggestions,
      confidence: 0.9,
    };
  }

  if (hasReviewTopic) {
    reasons.push(
      "Обявата може да е свързана с пчеларство, но има нужда от ръчна проверка.",
    );
    suggestions.push(
      "Добави повече детайли как продуктът или услугата се използва за пчели, кошери, мед или пчелин.",
    );

    return {
      status: "REVIEW",
      reasons,
      suggestions,
      confidence: 0.7,
    };
  }

  if (description.length < MIN_LISTING_DESCRIPTION_LENGTH) {
    return {
      status: "REVIEW",
      reasons,
      suggestions,
      confidence: 0.62,
    };
  }

  return {
    status: "APPROVED",
    reasons,
    suggestions,
    confidence: 0.9,
  };
}
