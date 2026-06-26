import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendReviewNotificationEmail } from "@/lib/admin-email";
import type { Listing } from "@/lib/marketplace";

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

  const body = (await request.json().catch(() => null)) as {
    listingId?: string;
  } | null;

  if (!body?.listingId) {
    return NextResponse.json(
      { error: "Липсва ID на обява." },
      { status: 400 },
    );
  }

  const supabase = createClient(
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
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: "Сесията е изтекла. Влез отново." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", body.listingId)
    .eq("user_id", user.id)
    .eq("moderation_status", "review")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: "Обявата не е намерена или не чака проверка." },
      { status: 404 },
    );
  }

  const result = await sendReviewNotificationEmail(data as Listing);

  return NextResponse.json({ ok: true, ...result });
}
