import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type AuthMode = "login" | "register";

function safeString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

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

function getSafeNextPath(value: string) {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

function redirectToAuth(
  request: NextRequest,
  mode: AuthMode,
  params: Record<string, string>
) {
  const url = new URL("/auth", getRequestOrigin(request));
  url.searchParams.set("mode", mode);

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  return NextResponse.redirect(url, { status: 303 });
}

function isValidPhone(phone: string) {
  return /^[+0-9\s().-]{7,20}$/.test(phone);
}

function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Za-zА-Яа-я]/.test(password) && /\d/.test(password);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const modeValue = safeString(formData.get("mode"));
  const mode: AuthMode = modeValue === "register" ? "register" : "login";

  const fullName = safeString(formData.get("fullName"));
  const phone = safeString(formData.get("phone"));
  const email = safeString(formData.get("email"));
  const password = safeString(formData.get("password"));
  const confirmPassword = safeString(formData.get("confirmPassword"));
  const nextPath = getSafeNextPath(safeString(formData.get("next")));

  if (!email || !password) {
    return redirectToAuth(request, mode, {
      error: "Моля, въведи имейл и парола.",
    });
  }

  const supabase = await createClient();

  if (mode === "register") {
    if (!fullName || fullName.split(/\s+/).length < 2) {
      return redirectToAuth(request, "register", {
        error: "Моля, въведи име и фамилия.",
      });
    }

    if (!phone || !isValidPhone(phone)) {
      return redirectToAuth(request, "register", {
        error: "Моля, въведи валиден телефонен номер.",
      });
    }

    if (!isStrongPassword(password)) {
      return redirectToAuth(request, "register", {
        error: "Паролата трябва да е поне 8 символа и да съдържа буква и цифра.",
      });
    }

    if (password !== confirmPassword) {
      return redirectToAuth(request, "register", {
        error: "Паролите не съвпадат.",
      });
    }

    const emailRedirectTo = new URL("/auth/callback", getRequestOrigin(request));
    emailRedirectTo.searchParams.set("next", nextPath);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: emailRedirectTo.toString(),
        data: {
          full_name: fullName,
          phone,
        },
      },
    });

    if (error) {
      return redirectToAuth(request, "register", {
        error: error.message,
      });
    }

    return redirectToAuth(request, "login", {
      message:
        "Регистрацията е изпратена. Провери имейла си или влез, ако потвърждението не е нужно.",
    });
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirectToAuth(request, "login", {
      error: error.message,
    });
  }

  const redirectUrl = new URL(nextPath, getRequestOrigin(request));
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
