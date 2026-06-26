"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ShieldX } from "lucide-react";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase-client";
import { formatDateTime } from "@/lib/marketplace";

type VerifiedApplication = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  babh_registration_number: string;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
};

export default function AdminVerifiedPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUserId, setAdminUserId] = useState("");
  const [applications, setApplications] = useState<VerifiedApplication[]>([]);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");

  async function loadApplications() {
    const { data, error } = await supabase
      .from("verified_beekeeper_applications")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setApplications((data ?? []) as VerifiedApplication[]);
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const allowed = isAdminEmail(user?.email);

      if (!mounted) {
        return;
      }

      setIsAdmin(allowed);
      setAdminUserId(user?.id ?? "");

      if (allowed) {
        await loadApplications();
      }

      if (mounted) {
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function reviewApplication(
    application: VerifiedApplication,
    status: "approved" | "rejected",
  ) {
    setErrorMessage("");
    const adminNote = adminNotes[application.id]?.trim() || null;
    const reviewedAt = new Date().toISOString();

    const { error } = await supabase
      .from("verified_beekeeper_applications")
      .update({
        status,
        admin_note: adminNote,
        reviewed_at: reviewedAt,
        reviewed_by: adminUserId || null,
      })
      .eq("id", application.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (status === "approved") {
      await supabase
        .from("profiles")
        .update({ is_verified_beekeeper: true })
        .eq("id", application.user_id);

      await supabase
        .from("listings")
        .update({ seller_is_verified: true })
        .eq("user_id", application.user_id);
    }

    setApplications((items) =>
      items.filter((item) => item.id !== application.id),
    );
  }

  return (
    <main
      className="min-h-screen bg-cover bg-fixed bg-center text-slate-950"
      style={{ backgroundImage: "url('/bee-background.png')" }}
    >
      <div className="min-h-screen bg-gradient-to-b from-white/80 via-amber-50/55 to-white/80">
        <Header />
        <div className="mx-auto max-w-5xl px-4 py-6">
          <section className="rounded-2xl border border-amber-100 bg-white/95 p-5 shadow-sm ring-1 ring-white/80 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black tracking-tight">
                  Проверки на пчелари
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Кандидатури за зелено тикче “Проверен пчелар”.
                </p>
              </div>
              <Link
                href="/admin/moderation"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Модерация
              </Link>
            </div>

            {loading ? (
              <p className="mt-5 text-sm font-semibold text-slate-600">
                Зареждане...
              </p>
            ) : !isAdmin ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                Нямаш достъп до тази страница.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {errorMessage ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                {applications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-600">
                    Няма кандидатури, чакащи проверка.
                  </div>
                ) : (
                  applications.map((application) => (
                    <article
                      key={application.id}
                      className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm"
                    >
                      <div className="grid gap-3 md:grid-cols-[1fr_240px]">
                        <div>
                          <h2 className="text-lg font-black">
                            {application.full_name || "Без име"}
                          </h2>
                          <div className="mt-2 space-y-1 text-sm text-slate-700">
                            <p>
                              <strong>Email:</strong>{" "}
                              {application.email || "Няма"}
                            </p>
                            <p>
                              <strong>Телефон:</strong>{" "}
                              {application.phone || "Няма"}
                            </p>
                            <p>
                              <strong>БАБХ номер:</strong>{" "}
                              {application.babh_registration_number}
                            </p>
                            <p>
                              <strong>Изпратена:</strong>{" "}
                              {formatDateTime(application.created_at)}
                            </p>
                          </div>
                          {application.message ? (
                            <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                              {application.message}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <textarea
                            value={adminNotes[application.id] || ""}
                            onChange={(event) =>
                              setAdminNotes((items) => ({
                                ...items,
                                [application.id]: event.target.value,
                              }))
                            }
                            rows={4}
                            placeholder="Бележка от администратора"
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              reviewApplication(application, "approved")
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 active:scale-[0.98]"
                          >
                            <BadgeCheck size={16} />
                            Одобри
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              reviewApplication(application, "rejected")
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100 active:scale-[0.98]"
                          >
                            <ShieldX size={16} />
                            Отхвърли
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
