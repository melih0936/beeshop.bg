import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { moderateListingWithAI } from "@/lib/ai-moderation";
import {
  isBabhRegistrationRequired,
  MAX_LISTING_DESCRIPTION_LENGTH,
  MIN_LISTING_DESCRIPTION_LENGTH,
  validateBeekeepingListing,
} from "@/lib/listing-validation";
import { sendReviewNotificationEmail } from "@/lib/admin-email";
import { MAX_LISTING_IMAGES } from "@/lib/marketplace";

type CreateListingBody = {
  title?: string;
  description?: string;
  price?: number | null;
  category?: string;
  subcategory?: string;
  region?: string;
  city?: string;
  neighborhood?: string | null;
  seller_name?: string;
  seller_phone?: string;
  babh_registration_number?: string | null;
  is_negotiable?: boolean;
  terms_accepted?: boolean;
  responsibility_accepted?: boolean;
  captchaToken?: string;
  imageCount?: number;
  imageDataUrls?: string[];
};

function sanitizeText(value: unknown, maxLength: number) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");

  return scheme?.toLowerCase() === "bearer" ? token : "";
}

async function verifyCaptcha(token?: string): Promise<{ ok: boolean; error?: string }> {
  void token;
  return { ok: true };
}

async function getAuthenticatedSupabase(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { supabase, user };
  }

  const token = getBearerToken(request);

  if (!token) {
    return { supabase, user: null };
  }

  const bearerSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );
  const {
    data: { user: bearerUser },
  } = await bearerSupabase.auth.getUser(token);

  return { supabase: bearerSupabase, user: bearerUser };
}

async function checkCreateRateLimit(supabase: Awaited<ReturnType<typeof getAuthenticatedSupabase>>["supabase"], userId: string) {
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", "listing_create")
    .gte("created_at", since);

  if (countError) {
    console.warn("Listing create rate limit check failed:", countError.message);
    return { ok: true };
  }

  if ((count ?? 0) >= 3) {
    return {
      ok: false,
      error:
        "Публикуваш твърде много обяви за кратко време. Опитай отново след няколко минути.",
    };
  }

  const { error } = await supabase
    .from("rate_limits")
    .insert({ user_id: userId, action: "listing_create" });

  if (error) {
    console.warn("Listing create rate limit insert failed:", error.message);
  }

  return { ok: true };
}

async function checkActiveListingLimit(
  supabase: Awaited<ReturnType<typeof getAuthenticatedSupabase>>["supabase"],
  userId: string,
) {
  const now = new Date().toISOString();
  const { count, error } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("moderation_status", ["approved", "review"])
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (error) {
    console.warn("Active listing limit check failed:", error.message);
    return { ok: true };
  }

  if ((count ?? 0) >= 4) {
    return {
      ok: false,
      error:
        "Можеш да имаш максимум 4 активни обяви. Скоро ще добавим платени пакети за повече обяви.",
    };
  }

  return { ok: true };
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedSupabase(request);

  if (!user) {
    return NextResponse.json(
      { error: "Необходимо е да влезеш в профила си." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as CreateListingBody | null;

  if (!body) {
    return NextResponse.json(
      { error: "Невалидни данни за обява." },
      { status: 400 },
    );
  }

  const title = sanitizeText(body.title, 120);
  const description = String(body.description || "").trim();
  const category = sanitizeText(body.category, 80);
  const subcategory = sanitizeText(body.subcategory, 120);
  const region = sanitizeText(body.region, 80);
  const city = sanitizeText(body.city, 80);
  const neighborhood = sanitizeText(body.neighborhood, 80);
  const seller_name = sanitizeText(body.seller_name, 120);
  const seller_phone = sanitizeText(body.seller_phone, 40);
  const babhRegistrationNumber = sanitizeText(
    body.babh_registration_number,
    80,
  );
  const isNegotiable = Boolean(body.is_negotiable);
  const price =
    isNegotiable || body.price === null || body.price === undefined
      ? null
      : Number(body.price);

  if (
    !title ||
    !description ||
    !category ||
    !subcategory ||
    !region ||
    !city ||
    !seller_name ||
    !seller_phone
  ) {
    return NextResponse.json(
      { error: "Попълни всички задължителни полета." },
      { status: 400 },
    );
  }

  if (!body.terms_accepted) {
    return NextResponse.json(
      { error: "Трябва да приемеш условията за публикуване." },
      { status: 400 },
    );
  }

  if (!body.responsibility_accepted) {
    return NextResponse.json(
      { error: "Трябва да потвърдиш, че носиш отговорност за обявата." },
      { status: 400 },
    );
  }

  if (description.length < MIN_LISTING_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      { error: "Описанието трябва да е поне 40 символа." },
      { status: 400 },
    );
  }

  if (description.length > MAX_LISTING_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      { error: "Описанието не може да бъде повече от 7000 символа." },
      { status: 400 },
    );
  }

  if (!isNegotiable && (!Number.isFinite(price) || Number(price) < 0)) {
    return NextResponse.json(
      { error: "Попълни валидна цена или избери „По договаряне“." },
      { status: 400 },
    );
  }

  if (!body.imageCount || body.imageCount < 1) {
    return NextResponse.json(
      { error: "Качи поне 1 снимка към обявата." },
      { status: 400 },
    );
  }

  if (body.imageCount > MAX_LISTING_IMAGES) {
    return NextResponse.json(
      { error: "Можеш да качиш максимум 5 снимки към една обява." },
      { status: 400 },
    );
  }

  if (
    isBabhRegistrationRequired({ category, subcategory, title, description }) &&
    !babhRegistrationNumber
  ) {
    return NextResponse.json(
      { error: "За тази категория е нужен регистрационен номер към БАБХ." },
      { status: 400 },
    );
  }

  const captcha = await verifyCaptcha(body.captchaToken);

  if (!captcha.ok) {
    return NextResponse.json(
      { error: captcha.error || "CAPTCHA проверката не беше успешна." },
      { status: 400 },
    );
  }

  const localValidation = validateBeekeepingListing({
    title,
    description,
    category,
    subcategory,
  });

  if (localValidation.status === "REJECTED") {
    return NextResponse.json(
      {
        status: "REJECTED",
        reasons: localValidation.reasons,
        suggestions: localValidation.suggestions,
        error: "Обявата не може да бъде публикувана.",
      },
      { status: 400 },
    );
  }

  const rateLimit = await checkCreateRateLimit(supabase, user.id);

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: rateLimit.error },
      { status: 429 },
    );
  }

  const activeListingLimit = await checkActiveListingLimit(supabase, user.id);

  if (!activeListingLimit.ok) {
    return NextResponse.json(
      { error: activeListingLimit.error },
      { status: 400 },
    );
  }

  const moderation = await moderateListingWithAI({
    title,
    description,
    category,
    subcategory,
    city,
    price,
    is_negotiable: isNegotiable,
    imageDataUrls: body.imageDataUrls || [],
  });

  if (moderation.status === "REJECTED") {
    return NextResponse.json(
      {
        status: "REJECTED",
        reasons: [moderation.reason],
        error: "Обявата не може да бъде публикувана.",
      },
      { status: 400 },
    );
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const moderationStatus =
    moderation.status === "APPROVED" ? "approved" : "review";
  const { data: createdListing, error } = await supabase
    .from("listings")
    .insert({
      title,
      description,
      price,
      category,
      subcategory,
      region,
      city,
      neighborhood: neighborhood || null,
      seller_name,
      seller_phone,
      babh_registration_number: babhRegistrationNumber || null,
      image_url: null,
      is_vip: false,
      moderation_status: moderationStatus,
      moderation_reason: moderation.reason,
      moderation_confidence: moderation.confidence,
      moderated_at: new Date().toISOString(),
      user_id: user.id,
      expires_at: expiresAt,
      is_negotiable: isNegotiable,
    })
    .select("*")
    .single();

  if (error || !createdListing) {
    return NextResponse.json(
      { error: `Грешка при публикуване: ${error?.message || "опитай отново."}` },
      { status: 500 },
    );
  }

  if (moderationStatus === "review") {
    await sendReviewNotificationEmail(createdListing).catch((emailError) => {
      console.warn("Review email failed:", emailError);
    });
  }

  return NextResponse.json({
    ok: true,
    listing: {
      id: createdListing.id,
      moderation_status: moderationStatus,
    },
    message:
      moderationStatus === "review"
        ? "Обявата е изпратена за ръчна проверка. Ще бъде видима след одобрение."
        : "Обявата е публикувана успешно.",
  });
}
