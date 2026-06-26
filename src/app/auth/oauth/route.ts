import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

function getRequestOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? request.nextUrl.host;
  const protocol = forwardedProto ?? request.nextUrl.protocol.replace(":", "");
  const safeHost = host.startsWith("0.0.0.0")
    ? host.replace("0.0.0.0", "localhost")
    : host;

  return `${protocol}://${safeHost}`;
}

function getSafeNextPath(value: string | null) {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider");
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"));

  if (provider !== "google" && provider !== "facebook") {
    const url = new URL("/auth", getRequestOrigin(request));
    url.searchParams.set("mode", "login");
    url.searchParams.set("error", "Невалиден OAuth доставчик.");
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();

  const callbackUrl = new URL("/auth/callback", getRequestOrigin(request));
  callbackUrl.searchParams.set("next", nextPath);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    const url = new URL("/auth", getRequestOrigin(request));
    url.searchParams.set("mode", "login");
    url.searchParams.set(
      "error",
      error?.message ?? "OAuth входът не можа да стартира."
    );
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(data.url);
}
