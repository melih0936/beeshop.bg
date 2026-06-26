"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PlusCircle,
  Save,
  User,
} from "lucide-react";
import Header from "@/components/Header";
import ProfileListingCard from "@/components/ProfileListingCard";
import SiteFooter from "@/components/SiteFooter";
import VerifiedBeekeeperApplication from "@/components/VerifiedBeekeeperApplication";
import { createClient } from "@/lib/supabase-client";
import { regions, type Listing } from "@/lib/marketplace";

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("Русе");
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [isVerifiedBeekeeper, setIsVerifiedBeekeeper] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const timeout = window.setTimeout(() => {
      if (mounted) {
        setErrorMessage(
          "Проверката на профила отне твърде дълго. Опитай да презаредиш страницата.",
        );
        setLoading(false);
      }
    }, 10000);

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (!user) {
        window.clearTimeout(timeout);
        router.replace("/auth");
        return;
      }

      setEmail(user.email ?? "");
      setUserId(user.id);
      setFullName(user.user_metadata?.full_name ?? "");
      setPhone(user.user_metadata?.phone ?? "");
      setRegion(user.user_metadata?.region ?? "Русе");

      let verified = Boolean(user.user_metadata?.is_verified_beekeeper);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_verified_beekeeper")
        .eq("id", user.id)
        .maybeSingle<{ is_verified_beekeeper: boolean | null }>();

      if (profileData?.is_verified_beekeeper) {
        verified = true;
      }
      setIsVerifiedBeekeeper(verified);

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!mounted) {
        return;
      }

      if (error) {
        setErrorMessage(
          `Не успяхме да заредим твоите обяви: ${error.message}`,
        );
      } else {
        setMyListings((data ?? []) as Listing[]);
      }

      window.clearTimeout(timeout);
      setLoading(false);
    }

    loadProfile().catch((error: unknown) => {
      if (!mounted) {
        return;
      }
      window.clearTimeout(timeout);
      setErrorMessage(
        error instanceof Error
          ? `Грешка при зареждане на профила: ${error.message}`
          : "Грешка при зареждане на профила.",
      );
      setLoading(false);
    });

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [router, supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        phone: phone.trim(),
        region,
      },
    });

    setSaving(false);

    if (error) {
      setErrorMessage(`Грешка при запазване: ${error.message}`);
      return;
    }

    setMessage("Профилът е обновен успешно.");
    router.refresh();
  }

  if (loading) {
    return (
      <main
        className="min-h-screen bg-cover bg-fixed bg-center text-slate-950"
        style={{ backgroundImage: "url('/bee-background.png')" }}
      >
        <div className="min-h-screen bg-white/70">
          <Header />
          <div className="px-4 py-8">
            <div className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white/95 p-5 text-sm font-semibold shadow-sm">
              Проверка на профила...
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-cover bg-fixed bg-center text-slate-950"
      style={{ backgroundImage: "url('/bee-background.png')" }}
    >
      <div className="min-h-screen bg-white/70">
        <Header />
        <div className="px-4 py-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-800"
              >
                <ArrowLeft size={16} />
                Назад към началото
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/messages"
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/95 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <MessageCircle size={16} />
                  Моите съобщения
                </Link>
                <Link
                  href="/post"
                  className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
                >
                  <PlusCircle size={16} />
                  Пусни нова обява
                </Link>
              </div>
            </div>

            <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-2xl font-black text-amber-800">
                  {fullName ? fullName[0].toUpperCase() : "П"}
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-black tracking-tight">
                    Моят профил
                  </h1>
                  <p className="mt-1 truncate text-sm text-slate-600">
                    {email}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                <span className="inline-flex items-center gap-2">
                  <BadgeCheck
                    size={16}
                    className={
                      isVerifiedBeekeeper ? "text-emerald-600" : "text-slate-400"
                    }
                  />
                  Проверен пчелар: {isVerifiedBeekeeper ? "Да" : "Не"}
                </span>
              </div>

              {message ? (
                <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                  {message}
                </div>
              ) : null}
              {errorMessage ? (
                <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 flex items-center gap-2 text-sm font-bold">
                    <Mail size={15} />
                    Email
                  </span>
                  <input
                    value={email}
                    disabled
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 flex items-center gap-2 text-sm font-bold">
                    <User size={15} />
                    Име
                  </span>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Иван Иванов"
                    className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 flex items-center gap-2 text-sm font-bold">
                    <Phone size={15} />
                    Телефон
                  </span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0888123456"
                    className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 flex items-center gap-2 text-sm font-bold">
                    <MapPin size={15} />
                    Област
                  </span>
                  <select
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                  >
                    {regions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <div className="md:col-span-2">
                  <button
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60 md:w-auto"
                  >
                    <Save size={16} />
                    {saving ? "Запазване..." : "Запази промените"}
                  </button>
                </div>
              </form>
            </section>

            <VerifiedBeekeeperApplication isVerified={isVerifiedBeekeeper} />

            <section className="mt-4 rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black tracking-tight">
                    Моите обяви
                  </h2>
                  <p className="text-sm text-slate-600">
                    Обяви, публикувани от текущия профил.
                  </p>
                </div>
                <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                  {myListings.length}
                </span>
              </div>

              {myListings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    Все още нямаш публикувани обяви.
                  </p>
                  <Link
                    href="/post"
                    className="mt-3 inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
                  >
                    <PlusCircle size={16} />
                    Пусни първата
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {myListings.map((listing) => (
                    <ProfileListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </section>

            <p className="mt-3 text-xs text-slate-500">Профил ID: {userId}</p>
          </div>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
