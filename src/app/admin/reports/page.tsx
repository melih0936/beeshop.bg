"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase-client";
import { formatDateTime } from "@/lib/marketplace";
import { isAdminEmail } from "@/lib/admin";

type ListingReport = {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  message: string | null;
  status: string;
  created_at: string;
};

type MessageReport = {
  id: string;
  message_id: string;
  conversation_id: string;
  reporter_id: string;
  reason: string;
  message: string | null;
  status: string;
  created_at: string;
};

export default function AdminReportsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [listingReports, setListingReports] = useState<ListingReport[]>([]);
  const [messageReports, setMessageReports] = useState<MessageReport[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadReports() {
    const [{ data: listingData, error: listingError }, { data: messageData, error: messageError }] =
      await Promise.all([
        supabase
          .from("listing_reports")
          .select("*")
          .eq("status", "open")
          .order("created_at", { ascending: false }),
        supabase
          .from("message_reports")
          .select("*")
          .eq("status", "open")
          .order("created_at", { ascending: false }),
      ]);

    if (listingError || messageError) {
      setErrorMessage(listingError?.message || messageError?.message || "");
      return;
    }

    setListingReports((listingData ?? []) as ListingReport[]);
    setMessageReports((messageData ?? []) as MessageReport[]);
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
      setChecking(false);

      if (allowed) {
        await loadReports();
      }
    }

    load();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function markReviewed(table: "listing_reports" | "message_reports", id: string) {
    const { error } = await supabase
      .from(table)
      .update({ status: "reviewed", reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadReports();
  }

  return (
    <main
      className="min-h-screen bg-cover bg-fixed bg-center text-slate-950"
      style={{ backgroundImage: "url('/bee-background.png')" }}
    >
      <div className="min-h-screen bg-gradient-to-b from-white/80 via-amber-50/55 to-white/80">
        <Header />
        <div className="mx-auto max-w-5xl px-4 py-8">
          <section className="rounded-2xl border border-amber-100 bg-white/95 p-5 shadow-sm ring-1 ring-white/80">
            <h1 className="text-2xl font-black">Доклади</h1>

            {checking ? (
              <p className="mt-4 text-sm font-semibold text-slate-600">
                Проверка на достъп...
              </p>
            ) : null}

            {!checking && !isAdmin ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                Нямаш достъп до тази страница.
              </p>
            ) : null}

            {errorMessage ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {errorMessage}
              </p>
            ) : null}

            {isAdmin ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h2 className="text-lg font-black">Доклади за обяви</h2>
                  <div className="mt-3 space-y-3">
                    {listingReports.length === 0 ? (
                      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        Няма отворени доклади за обяви.
                      </p>
                    ) : (
                      listingReports.map((report) => (
                        <article
                          key={report.id}
                          className="rounded-xl border border-amber-100 bg-white p-3 text-sm shadow-sm"
                        >
                          <p className="font-black">{report.reason}</p>
                          <p className="mt-1 text-slate-600">
                            {report.message || "Без допълнително съобщение."}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {formatDateTime(report.created_at)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link
                              href={`/listings/${report.listing_id}`}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50"
                            >
                              Отвори обява
                            </Link>
                            <button
                              type="button"
                              onClick={() => markReviewed("listing_reports", report.id)}
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                            >
                              Маркирай като прегледано
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-black">Доклади за съобщения</h2>
                  <div className="mt-3 space-y-3">
                    {messageReports.length === 0 ? (
                      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        Няма отворени доклади за съобщения.
                      </p>
                    ) : (
                      messageReports.map((report) => (
                        <article
                          key={report.id}
                          className="rounded-xl border border-amber-100 bg-white p-3 text-sm shadow-sm"
                        >
                          <p className="font-black">{report.reason}</p>
                          <p className="mt-1 text-slate-600">
                            {report.message || "Без допълнително съобщение."}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {formatDateTime(report.created_at)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link
                              href={`/messages/${report.conversation_id}`}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50"
                            >
                              Отвори разговор
                            </Link>
                            <button
                              type="button"
                              onClick={() => markReviewed("message_reports", report.id)}
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                            >
                              Маркирай като прегледано
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
