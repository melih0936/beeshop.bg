import Link from "next/link";
import AuthForm from "@/components/AuthForm";

type AuthPageProps = {
  searchParams?: Promise<{
    mode?: string;
    error?: string;
    message?: string;
    next?: string;
  }>;
};

function GlossyLogo() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-3 rounded-full border border-amber-200 bg-white/80 px-3 py-2 shadow-lg shadow-amber-950/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-amber-950/15"
      aria-label="Към началната страница на BeeShop.bg"
    >
      <span className="relative h-11 w-11 overflow-hidden rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-stone-950 p-0.5 shadow-inner">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/60 via-transparent to-transparent opacity-80" />
        <img
          src="/bees-bg.png"
          alt="BeeShop.bg"
          className="relative h-full w-full rounded-full object-cover ring-1 ring-black/10"
        />
      </span>

      <span className="bg-gradient-to-r from-stone-950 via-amber-700 to-stone-950 bg-clip-text text-sm font-black text-transparent">
        BeeShop.bg - Начало
      </span>
    </Link>
  );
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;

  const mode = params?.mode === "register" ? "register" : "login";
  const error = params?.error ?? "";
  const message = params?.message ?? "";
  const next = params?.next ?? "/";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fef3c7,transparent_36%),linear-gradient(135deg,#fff7ed_0%,#fafaf9_48%,#fef3c7_100%)] px-4 text-stone-950">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-6 py-4 sm:py-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:py-10">
        <section className="order-2 hidden rounded-[2rem] border border-amber-100 bg-white/80 p-8 shadow-sm backdrop-blur lg:block">
          <div className="mb-8">
            <GlossyLogo />
          </div>

          <h1 className="max-w-xl text-5xl font-black tracking-tight text-stone-950">
            Пчеларски обяви за България
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
            Платформа за пчелари, производители и хора, които търсят истински
            български мед, пчелни семейства, майки и инвентар.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-stone-950">
                Публикувай обяви
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Пчелни семейства, майки, кошери, инвентар и пчелни продукти.
              </p>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-stone-950">
                Намери български производители
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Подходящо както за пчелари, така и за хора, които търсят мед
                директно от производител.
              </p>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-stone-950">
                Повече доверие
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Профили с възможност за БАБХ верификация.
              </p>
            </div>
          </div>
        </section>

        <div className="order-1 mx-auto w-full max-w-md lg:order-2 lg:max-w-[470px]">
          <AuthForm mode={mode} error={error} message={message} next={next} />
        </div>
      </div>
    </main>
  );
}