"use client";

import Link from "next/link";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
  error?: string;
  message?: string;
  next?: string;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#1877F2" />
      <path fill="white" d="M15.64 12.69 16 10.34h-2.25V8.82c0-.64.31-1.27 1.32-1.27h1.03v-2s-.94-.16-1.84-.16c-1.88 0-3.11 1.14-3.11 3.2v1.75H9.06v2.35h2.09v5.68c.42.07.85.1 1.29.1s.87-.03 1.31-.1v-5.68h1.89Z" />
    </svg>
  );
}

function BrandLink() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 rounded-3xl border border-amber-200 bg-gradient-to-br from-white via-amber-50 to-white p-2 pr-4 shadow-lg shadow-amber-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-950/15 active:scale-[0.99]"
      aria-label="Към началната страница на BeeShop.bg"
    >
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-200 via-amber-400 to-stone-950 p-0.5 shadow-inner ring-1 ring-amber-300/70">
        <span className="absolute inset-0 z-10 rounded-2xl bg-gradient-to-br from-white/55 via-transparent to-black/10" />
        <span className="absolute left-2 top-1 z-20 h-4 w-8 rounded-full bg-white/35 blur-sm" />
        <img
          src="/bees-bg.png"
          alt="BeeShop.bg"
          className="relative h-full w-full rounded-2xl object-cover"
        />
      </span>

      <span className="min-w-0">
        <span className="block bg-gradient-to-r from-stone-950 via-amber-700 to-stone-950 bg-clip-text text-base font-black leading-tight text-transparent">
          BeeShop.bg - Начало
        </span>
        <span className="block text-xs font-bold leading-tight text-stone-500 transition group-hover:text-amber-700">
          Натисни за връщане към началната страница
        </span>
      </span>
    </Link>
  );
}

function PasswordInput({
  name,
  label,
  placeholder,
  autoComplete,
  minLength,
}: {
  name: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  minLength: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-stone-800">
        {label}
      </span>

      <input
        required
        name={name}
        type="password"
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base font-medium outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
      />
    </label>
  );
}

export default function AuthForm({
  mode,
  error = "",
  message = "",
  next = "/",
}: AuthFormProps) {
  const isRegister = mode === "register";
  const encodedNext = encodeURIComponent(next || "/");

  const googleOAuthUrl = `/auth/oauth?provider=google&next=${encodedNext}`;
  const facebookOAuthUrl = `/auth/oauth?provider=facebook&next=${encodedNext}`;

  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white/95 p-4 shadow-xl shadow-amber-950/5 backdrop-blur sm:p-6">
      <div className="mb-4">
        <BrandLink />
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-2xl bg-stone-100 p-1">
        <Link
          href="/auth?mode=login"
          className={`rounded-xl px-4 py-2.5 text-center text-sm font-black transition ${
            !isRegister
              ? "bg-white text-stone-950 shadow-sm"
              : "text-stone-500 hover:text-stone-950"
          }`}
        >
          Вход
        </Link>

        <Link
          href="/auth?mode=register"
          className={`rounded-xl px-4 py-2.5 text-center text-sm font-black transition ${
            isRegister
              ? "bg-white text-stone-950 shadow-sm"
              : "text-stone-500 hover:text-stone-950"
          }`}
        >
          Регистрация
        </Link>
      </div>

      <div className="mb-4">
        <h2 className="text-2xl font-black tracking-tight text-stone-950">
          {isRegister ? "Създай профил" : "Добре дошъл"}
        </h2>

        <p className="mt-1 text-sm leading-6 text-stone-600">
          {isRegister
            ? "Попълни данните си, за да публикуваш и управляваш обяви."
            : "Влез, за да управляваш профила и обявите си."}
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <a
          href={googleOAuthUrl}
          className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-black text-stone-800 transition hover:bg-stone-50 active:scale-[0.99]"
        >
          <GoogleIcon />
          <span>Google</span>
        </a>

        <a
          href={facebookOAuthUrl}
          className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-black text-stone-800 transition hover:bg-stone-50 active:scale-[0.99]"
        >
          <FacebookIcon />
          <span>Facebook</span>
        </a>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-[11px] font-black uppercase tracking-wide text-stone-400">
          или с имейл
        </span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      <form action="/auth/email" method="post" acceptCharset="UTF-8" className="space-y-3">
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="next" value={next} />

        {isRegister ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-stone-800">
                Име и фамилия
              </span>
              <input
                required
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Иван Иванов"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base font-medium outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-stone-800">
                Телефон
              </span>
              <input
                required
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="0888 123 456"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base font-medium outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              />
            </label>
          </div>
        ) : null}

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-stone-800">
            Имейл
          </span>
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base font-medium outline-none transition placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
          />
        </label>

        {isRegister ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <PasswordInput
              name="password"
              label="Парола"
              minLength={8}
              autoComplete="new-password"
              placeholder="Буква и цифра"
            />

            <PasswordInput
              name="confirmPassword"
              label="Повтори парола"
              minLength={8}
              autoComplete="new-password"
              placeholder="Повтори паролата"
            />
          </div>
        ) : (
          <PasswordInput
            name="password"
            label="Парола"
            minLength={6}
            autoComplete="current-password"
            placeholder="Твоята парола"
          />
        )}

        {isRegister ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-2.5 text-xs font-semibold leading-5 text-amber-900">
            Паролата трябва да е поне 8 символа и да съдържа поне една буква и
            една цифра.
          </p>
        ) : null}

        <button
          type="submit"
          className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-base font-black text-stone-950 shadow-sm transition hover:bg-amber-300 active:scale-[0.99]"
        >
          {isRegister ? "Създай профил" : "Вход"}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] leading-5 text-stone-500">
        Продължавайки, приемаш правилата на BeeShop.bg и се съгласяваш да
        използваш платформата коректно.
      </p>
    </section>
  );
}