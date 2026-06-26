"use client";

import { useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { createClient } from "@/lib/supabase-client";

const messageReportReasons = [
  "Спам",
  "Измама",
  "Обиден език",
  "Забранено съдържание",
  "Друго",
];

export default function ReportMessageButton({
  messageId,
  conversationId,
}: {
  messageId: string;
  conversationId: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(messageReportReasons[0]);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitReport() {
    setLoading(true);
    setErrorMessage("");
    setStatusMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage("Трябва да влезеш в профила си.");
      setLoading(false);
      return;
    }

    const { data: conversation } = await supabase
      .from("conversations")
      .select("buyer_id,seller_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (
      !conversation ||
      (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)
    ) {
      setErrorMessage("Нямаш достъп до този разговор.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("message_reports").insert({
      message_id: messageId,
      conversation_id: conversationId,
      reporter_id: user.id,
      reason,
      message: message.trim() || null,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setStatusMessage("Благодарим. Докладът е изпратен за проверка.");
    setMessage("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-red-600"
      >
        <Flag size={12} />
        Докладвай съобщение
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 text-slate-900 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">Докладвай съобщение</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-bold hover:bg-slate-50"
              >
                Затвори
              </button>
            </div>

            {errorMessage ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {errorMessage}
              </p>
            ) : null}
            {statusMessage ? (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                {statusMessage}
              </p>
            ) : null}

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-bold">Причина</span>
                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                >
                  {messageReportReasons.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-bold">
                  Съобщение по избор
                </span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                />
              </label>
              <button
                type="button"
                onClick={submitReport}
                disabled={loading || Boolean(statusMessage)}
                className="inline-flex w-full items-center justify-center rounded-md bg-amber-500 px-4 py-3 text-sm font-black text-white hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Изпращане..." : "Изпрати доклад"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
