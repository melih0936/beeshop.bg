"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BadgeCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase-client";

type ApplicationStatus = "pending" | "approved" | "rejected";

type VerifiedApplication = {
  id: string;
  status: ApplicationStatus;
  admin_note: string | null;
  babh_registration_number: string;
  created_at: string;
};

function isValidBabhNumber(value: string) {
  return /[\p{L}\p{N}]/u.test(value);
}

export default function VerifiedBeekeeperApplication({
  isVerified,
}: {
  isVerified: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [application, setApplication] = useState<VerifiedApplication | null>(null);
  const [applicantFullName, setApplicantFullName] = useState("");
  const [babhNumber, setBabhNumber] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadApplication() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const profileName = String(user.user_metadata?.full_name ?? "").trim();

      if (profileName) {
        setApplicantFullName((current) => current || profileName);
      }

      const { data } = await supabase
        .from("verified_beekeeper_applications")
        .select("id,status,admin_note,babh_registration_number,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<VerifiedApplication>();

      setApplication(data ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  async function submitApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const cleanFullName = applicantFullName.replace(/\s+/g, " ").trim();
    const cleanNumber = babhNumber.replace(/\s+/g, " ").trim();
    const cleanNote = note.replace(/\s+/g, " ").trim();

    if (!cleanFullName) {
      setError("Въведи име и фамилия.");
      return;
    }

    if (cleanFullName.split(" ").filter(Boolean).length < 2) {
      setError("Въведи име и фамилия, както са по регистрация.");
      return;
    }

    if (!cleanNumber) {
      setError("Въведи регистрационен номер към БАБХ.");
      return;
    }

    if (cleanNumber.length < 3) {
      setError("Номерът изглежда твърде кратък.");
      return;
    }

    if (!isValidBabhNumber(cleanNumber)) {
      setError("Въведи валиден номер, а не само символи.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Влез в профила си, за да кандидатстваш.");
      return;
    }

    const { data: pending } = await supabase
      .from("verified_beekeeper_applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle<{ id: string }>();

    if (pending?.id) {
      setError("Вече имаш кандидатура, която чака проверка.");
      setOpen(false);
      await loadApplication();
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase
      .from("verified_beekeeper_applications")
      .insert({
        user_id: user.id,
        email: user.email ?? null,
        full_name: cleanFullName,
        phone: user.user_metadata?.phone ?? null,
        babh_registration_number: cleanNumber,
        message: cleanNote || null,
        status: "pending",
      });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage("Кандидатурата е изпратена. Ще бъде проверена от администратор.");
    setApplicantFullName("");
    setBabhNumber("");
    setNote("");
    setOpen(false);
    await loadApplication();
  }

  const status = isVerified ? "approved" : application?.status;

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-slate-950/70 px-3 py-4">
            <form
              onSubmit={submitApplication}
              className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl"
            >
              <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black text-slate-950">
                      Кандидатстване за проверен пчелар
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-emerald-700">
                      Администраторът ще провери въведения номер в публичните
                      регистри на БАБХ.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="shrink-0 rounded-md p-2 text-slate-500 hover:bg-slate-100"
                    aria-label="Затвори"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                  <li>Провереният пчелар получава зелено тикче до името си.</li>
                  <li>Кандидатурата се проверява ръчно от администратор.</li>
                  <li>Въведи име и фамилия, както са по регистрация.</li>
                  <li>Въведи регистрационния си номер към БАБХ.</li>
                  <li>Данните трябва да са верни и актуални.</li>
                  <li>При неверни данни кандидатурата може да бъде отказана.</li>
                  <li>
                    BeeShop.bg не издава регистрация към БАБХ, а само отбелязва
                    потребители, които са заявили проверка.
                  </li>
                </ul>

                <label className="mt-5 block">
                  <span className="mb-1 block text-sm font-bold">
                    Име и фамилия
                  </span>
                  <input
                    value={applicantFullName}
                    onChange={(event) => setApplicantFullName(event.target.value)}
                    required
                    minLength={5}
                    maxLength={120}
                    placeholder="Например: Иван Иванов"
                    autoComplete="name"
                    className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    Въведи името, с което си регистриран/а към БАБХ.
                  </span>
                </label>

                <label className="mt-4 block">
                  <span className="mb-1 block text-sm font-bold">
                    Регистрационен номер към БАБХ
                  </span>
                  <input
                    value={babhNumber}
                    onChange={(event) => setBabhNumber(event.target.value)}
                    required
                    minLength={3}
                    maxLength={80}
                    placeholder="Въведи точния номер от удостоверението"
                    className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </label>

                <label className="mt-4 block">
                  <span className="mb-1 block text-sm font-bold">
                    Бележка към администратора
                  </span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={1000}
                    rows={4}
                    placeholder="По желание"
                    className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </label>

                {error ? (
                  <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                ) : null}
              </div>

              <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Отказ
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving ? "Изпращане..." : "Изпрати кандидатура"}
                  </button>
                </div>
              </div>
            </form>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <section className="mt-4 rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">Проверен пчелар</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Кандидатурата се проверява ръчно от администратор след справка в
              публичните регистри на БАБХ.
            </p>
          </div>

          <BadgeCheck
            size={24}
            className={
              status === "approved" ? "text-emerald-600" : "text-slate-300"
            }
          />
        </div>

        <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          {loading ? "Зареждане..." : null}
          {!loading && status === "pending" ? "Кандидатурата чака проверка." : null}
          {!loading && status === "approved" ? "Ти си проверен пчелар." : null}
          {!loading && status === "rejected"
            ? "Кандидатурата е отхвърлена. Можеш да кандидатстваш отново."
            : null}
          {!loading && !status ? "Все още не си кандидатствал за проверка." : null}
        </div>

        {message ? (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {status !== "pending" && status !== "approved" ? (
          <button
            type="button"
            onClick={() => {
              setError("");
              setMessage("");
              setOpen(true);
            }}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700 active:scale-[0.98]"
          >
            Кандидатствай за проверен пчелар
          </button>
        ) : null}
      </section>

      {modal}
    </>
  );
}