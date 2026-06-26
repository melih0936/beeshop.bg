import { validateBeekeepingListing } from "@/lib/listing-validation";

export type AIModerationStatus = "APPROVED" | "REVIEW" | "REJECTED";

export type AIModerationInput = {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  city?: string;
  price?: number | string | null;
  is_negotiable?: boolean | null;
  imageDataUrls?: string[];
};

export type AIModerationResult = {
  status: AIModerationStatus;
  reason: string;
  confidence: number;
};

const moderationPrompt = `Ти си модератор на сайт за пчеларски обяви в България.
Твоята задача е да проверяваш дали обявата е свързана с пчеларство, мед, кошери, инвентар, пчели или пчелни продукти.

Отговори само с валиден JSON:
{
  "status": "APPROVED" | "REVIEW" | "REJECTED",
  "reason": "кратка причина на български",
  "confidence": число между 0 и 1
}

Правила:
- APPROVED: ако обявата е ясно свързана с пчеларство.
- REVIEW: ако има съмнение, двусмислие или може да е свързана индиректно.
- REJECTED: ако е несвързана, забранена или спам.
- Разрешавай: пчели, семейства, майки, роеве, кошери, мед, восък, прополис, прашец, инвентар, оборудване, услуги за пчелари, транспорт на кошери, изкупуване на мед.
- Отхвърляй: коли, дрехи, телефони, компютри, недвижими имоти, услуги несвързани с пчеларство, наркотици, оръжия, алкохол, спам, gambling, crypto/forex.
- Бъди стриктен, но справедлив.`;

function normalizeResult(value: unknown): AIModerationResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const result = value as Partial<AIModerationResult>;
  const status = result.status;
  const confidence = Number(result.confidence);

  if (
    status !== "APPROVED" &&
    status !== "REVIEW" &&
    status !== "REJECTED"
  ) {
    return null;
  }

  return {
    status,
    reason:
      typeof result.reason === "string" && result.reason.trim()
        ? result.reason.trim()
        : "Автоматична проверка на съдържанието.",
    confidence: Number.isFinite(confidence)
      ? Math.min(1, Math.max(0, confidence))
      : 0.5,
  };
}

function parseJsonFromModel(content: string): AIModerationResult | null {
  try {
    return normalizeResult(JSON.parse(content));
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return normalizeResult(JSON.parse(match[0]));
    } catch {
      return null;
    }
  }
}

function localFallback(input: AIModerationInput): AIModerationResult {
  const local = validateBeekeepingListing({
    title: input.title,
    description: input.description,
    category: input.category,
    subcategory: input.subcategory || "",
  });

  return {
    status: local.status,
    reason:
      local.reasons.join(" ") ||
      (local.status === "APPROVED"
        ? "Обявата изглежда свързана с пчеларство."
        : "Обявата изисква ръчна проверка."),
    confidence: local.confidence,
  };
}

export async function moderateListingWithAI(
  input: AIModerationInput,
): Promise<AIModerationResult> {
  const enabled = process.env.AI_MODERATION_ENABLED === "true";
  const apiKey = process.env.AI_MODERATION_API_KEY;
  const model = process.env.AI_MODERATION_MODEL || "gpt-4o-mini";

  if (!enabled || !apiKey) {
    console.warn(
      "AI moderation is disabled or AI_MODERATION_API_KEY is missing. Falling back to local validation.",
    );
    return localFallback(input);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: moderationPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  title: input.title,
                  description: input.description,
                  category: input.category,
                  subcategory: input.subcategory || "",
                  city: input.city || "",
                  price: input.price ?? null,
                  is_negotiable: Boolean(input.is_negotiable),
                  image_instruction:
                    "Провери и снимките. Ако снимката ясно показва кола, телефон, лаптоп, дрехи или друг несвързан продукт, върни REJECTED, дори текстът да споменава мед или пчеларство.",
                }),
              },
              ...(input.imageDataUrls || []).slice(0, 3).map((url) => ({
                type: "image_url",
                image_url: { url },
              })),
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn("AI moderation request failed:", response.status);
      return {
        status: "REVIEW",
        reason:
          "Автоматичната проверка не успя и обявата изисква ръчна проверка.",
        confidence: 0.4,
      };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content || "";

    return (
      parseJsonFromModel(content) || {
        status: "REVIEW",
        reason: "Автоматичната проверка върна неясен резултат.",
        confidence: 0.4,
      }
    );
  } catch (error) {
    console.warn("AI moderation failed:", error);
    return {
      status: "REVIEW",
      reason:
        "Автоматичната проверка не е достъпна и обявата изисква ръчна проверка.",
      confidence: 0.4,
    };
  }
}
