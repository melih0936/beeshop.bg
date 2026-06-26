"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Paperclip, Send } from "lucide-react";
import { createClient } from "@/lib/supabase-client";
import {
  formatDateTime,
  type Conversation,
  type Listing,
  type Message,
  validateMessageAttachment,
} from "@/lib/marketplace";
import { markConversationAsRead } from "@/lib/messages-client";
import { checkRateLimit } from "@/lib/rate-limit-client";
import { uploadMessageAttachment } from "@/lib/storage-client";
import ReportMessageButton from "@/components/ReportMessageButton";

export default function MessageThread({
  conversationId,
}: {
  conversationId: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const endRef = useRef<HTMLDivElement | null>(null);
  const [userId, setUserId] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadThread() {
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth");
      return;
    }

    setUserId(user.id);

    const { data: conversationData, error: conversationError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle();

    if (conversationError || !conversationData) {
      setErrorMessage("Разговорът не е намерен или нямаш достъп до него.");
      setLoading(false);
      return;
    }

    const typedConversation = conversationData as Conversation;

    if (
      typedConversation.buyer_id !== user.id &&
      typedConversation.seller_id !== user.id
    ) {
      setErrorMessage("Нямаш достъп до този разговор.");
      setLoading(false);
      return;
    }

    setConversation(typedConversation);

    await markConversationAsRead(supabase, conversationId, user.id);

    const [{ data: listingData }, { data: messagesData, error: messagesError }] =
      await Promise.all([
        supabase
          .from("listings")
          .select("*")
          .eq("id", typedConversation.listing_id)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true }),
      ]);

    setListing((listingData ?? null) as Listing | null);

    if (messagesError) {
      setErrorMessage(messagesError.message);
    } else {
      setMessages((messagesData ?? []) as Message[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanBody = body.trim();
    if ((!cleanBody && !attachmentFile) || !conversation) {
      return;
    }

    setSending(true);
    setErrorMessage("");

    const rateLimit = await checkRateLimit({
      supabase,
      userId,
      action: "message_send",
      limit: 30,
      windowMinutes: 10,
    });

    if (!rateLimit.allowed) {
      setErrorMessage(rateLimit.error);
      setSending(false);
      return;
    }

    let attachment_url: string | null = null;
    let attachment_type: string | null = null;
    let attachment_name: string | null = null;
    let attachment_size: number | null = null;

    if (attachmentFile) {
      const validationError = validateMessageAttachment(attachmentFile);

      if (validationError) {
        setErrorMessage(validationError);
        setSending(false);
        return;
      }

      const uploadLimit = await checkRateLimit({
        supabase,
        userId,
        action: "attachment_upload",
        limit: 20,
        windowMinutes: 10,
      });

      if (!uploadLimit.allowed) {
        setErrorMessage(uploadLimit.error);
        setSending(false);
        return;
      }

      const uploadResult = await uploadMessageAttachment(
        supabase,
        attachmentFile,
        userId,
      );

      if (uploadResult.error) {
        setErrorMessage(`Грешка при качване: ${uploadResult.error.message}`);
        setSending(false);
        return;
      }

      attachment_url = uploadResult.publicUrl;
      attachment_type = attachmentFile.type;
      attachment_name = attachmentFile.name;
      attachment_size = attachmentFile.size;
    }

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: userId,
      body: cleanBody || "Прикачен файл",
      attachment_url,
      attachment_type,
      attachment_name,
      attachment_size,
    });

    setSending(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setBody("");
    setAttachmentFile(null);
    await loadThread();
  }

  if (loading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white/95 p-5 text-sm font-semibold shadow-sm">
        Зареждане на разговора...
      </section>
    );
  }

  if (errorMessage && !conversation) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
        {errorMessage}
      </section>
    );
  }

  const otherName =
    conversation?.seller_id === userId
      ? "Купувач"
      : listing?.seller_name || "Продавач";

  return (
    <section className="mx-auto flex h-[calc(100vh-112px)] max-w-3xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/messages"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50"
            aria-label="Назад към съобщения"
            title="Назад"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-black">
              {listing?.title || "Разговор"}
            </h1>
            <p className="truncate text-xs text-slate-500">
              Разговор с {otherName}
            </p>
          </div>
          {listing ? (
            <Link
              href={`/listings/${listing.id}`}
              className="rounded-md bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              Обява
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {messages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
            Няма съобщения. Напиши първото съобщение по тази обява.
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === userId;

            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMine
                      ? "rounded-br-md bg-amber-500 text-white"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
                  }`}
                >
                  <p className="whitespace-pre-line leading-6">{message.body}</p>
                  {message.attachment_url ? (
                    message.attachment_type?.startsWith("image/") ? (
                      <a
                        href={message.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block overflow-hidden rounded-lg border border-white/30"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={message.attachment_url}
                          alt={message.attachment_name || "Прикачена снимка"}
                          className="max-h-64 w-full object-cover"
                        />
                      </a>
                    ) : (
                      <a
                        href={message.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-2 inline-flex rounded-md px-3 py-2 text-xs font-bold ${
                          isMine
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {message.attachment_name || "PDF файл"}
                      </a>
                    )
                  ) : null}
                  <p
                    className={`mt-1 text-[11px] ${
                      isMine ? "text-white/80" : "text-slate-400"
                    }`}
                  >
                    {formatDateTime(message.created_at)}
                  </p>
                  {!isMine ? (
                    <ReportMessageButton
                      messageId={message.id}
                      conversationId={conversationId}
                    />
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {errorMessage ? (
        <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <form onSubmit={sendMessage} className="border-t border-slate-200 p-3">
        {attachmentFile ? (
          <div className="mb-2 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="truncate">{attachmentFile.name}</span>
            <button
              type="button"
              onClick={() => setAttachmentFile(null)}
              className="font-bold text-red-700"
            >
              Премахни
            </button>
          </div>
        ) : null}
        <div className="flex gap-2">
          <label className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
            <Paperclip size={17} />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (!file) {
                  return;
                }

                const validationError = validateMessageAttachment(file);
                if (validationError) {
                  setErrorMessage(validationError);
                  event.target.value = "";
                  return;
                }

                setErrorMessage("");
                setAttachmentFile(file);
                event.target.value = "";
              }}
            />
          </label>
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Напиши съобщение..."
            className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
          />
          <button
            disabled={sending || (!body.trim() && !attachmentFile)}
            className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-sm font-black text-white hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
          >
            <Send size={16} />
            {sending ? "Качване..." : "Изпрати"}
          </button>
        </div>
      </form>
    </section>
  );
}
