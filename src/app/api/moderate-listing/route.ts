import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  moderateListingWithAI,
  type AIModerationInput,
} from "@/lib/ai-moderation";
import { validateBeekeepingListing } from "@/lib/listing-validation";

type ModerationBody = AIModerationInput;

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");

  return scheme?.toLowerCase() === "bearer" ? token : "";
}

export async function POST(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Необходимо е да влезеш в профила си." },
      { status: 401 },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: "Сесията е изтекла. Влез отново." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as ModerationBody | null;

  if (!body) {
    return NextResponse.json(
      { error: "Невалидни данни за проверка." },
      { status: 400 },
    );
  }

  const local = validateBeekeepingListing({
    title: body.title || "",
    description: body.description || "",
    category: body.category || "",
    subcategory: body.subcategory || "",
  });

  if (local.status === "REJECTED") {
    return NextResponse.json({
      status: "REJECTED",
      reason:
        local.reasons.join(" ") ||
        "Обявата не изглежда свързана с пчеларство.",
      confidence: local.confidence,
    });
  }

  if (local.status === "REVIEW") {
    return NextResponse.json({
      status: "REVIEW",
      reason:
        local.reasons.join(" ") || "Обявата изисква ръчна проверка.",
      confidence: local.confidence,
    });
  }

  const result = await moderateListingWithAI(body);

  return NextResponse.json(result);
}
