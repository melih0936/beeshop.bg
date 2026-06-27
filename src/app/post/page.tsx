"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, PlusCircle } from "lucide-react";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase-client";
import {
  categories,
  categoryTree,
  MAX_LISTING_IMAGES,
  regions,
  sanitizeText,
  validateListingImage,
} from "@/lib/marketplace";
import { checkRateLimit } from "@/lib/rate-limit-client";
import { uploadListingImage } from "@/lib/storage-client";
import {
  MAX_LISTING_DESCRIPTION_LENGTH,
  MIN_LISTING_DESCRIPTION_LENGTH,
  validateBeekeepingListing,
} from "@/lib/listing-validation";

type CreateListingResponse = {
  ok?: boolean;
  listing?: {
    id: string;
    moderation_status: "approved" | "review";
  };
  message?: string;
  error?: string;
  reasons?: string[];
  suggestions?: string[];
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Invalid image preview."));
    reader.onerror = () => reject(reader.error || new Error("Image read failed."));
    reader.readAsDataURL(file);
  });
}

export default function PostListingPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [checkingUser, setCheckingUser] = useState(false);
  const [loginRequired, setLoginRequired] = useState(true);
  const [profileCheckError, setProfileCheckError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerRegion, setSellerRegion] = useState("Русе");
  const [selectedCategory, setSelectedCategory] = useState("Мед");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");
  const [descriptionLength, setDescriptionLength] = useState(0);
  const [validationReasons, setValidationReasons] = useState<string[]>([]);
  const [validationSuggestions, setValidationSuggestions] = useState<string[]>([]);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const authCheckDoneRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    authCheckDoneRef.current = false;

    const hardTimeout = window.setTimeout(() => {
      if (!mounted || authCheckDoneRef.current) {
        return;
      }

      authCheckDoneRef.current = true;
      setProfileCheckError(
        "Проверката на профила отне твърде дълго. Провери връзката и опитай отново.",
      );
      setCheckingUser(false);
    }, 8000);

    async function checkUser() {
      try {
        setCheckingUser(true);
        setLoginRequired(false);
        setProfileCheckError("");

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted || authCheckDoneRef.current) return;

        if (!session?.user) {
          authCheckDoneRef.current = true;
          setLoginRequired(true);
          setCheckingUser(false);
          return;
        }

        const user = session.user;
        authCheckDoneRef.current = true;
        setUserId(user.id);
        setSellerName(user.user_metadata?.full_name ?? "");
        setSellerPhone(user.user_metadata?.phone ?? "");
        setSellerRegion(user.user_metadata?.region ?? "Русе");
        setCheckingUser(false);
      } catch {
        if (!mounted || authCheckDoneRef.current) return;
        authCheckDoneRef.current = true;
        setProfileCheckError(
          "Не успяхме да проверим профила. Провери връзката и опитай отново.",
        );
        setCheckingUser(false);
      } finally {
        if (mounted && authCheckDoneRef.current) {
          window.clearTimeout(hardTimeout);
        }
      }
    }

    checkUser();

    return () => {
      mounted = false;
      window.clearTimeout(hardTimeout);
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setValidationReasons([]);
    setValidationSuggestions([]);
    setSubmitStatus("Проверка на обявата...");

    const formData = new FormData(event.currentTarget);
    const title = sanitizeText(String(formData.get("title") || ""), 120);
    const description = String(formData.get("description") || "").trim();
    const priceValue = String(formData.get("price") || "").trim();
    const category = String(formData.get("category") || "");
    const subcategory = String(formData.get("subcategory") || "");
    const region = String(formData.get("region") || "");
    const city = sanitizeText(String(formData.get("city") || ""), 80);
    const neighborhood = sanitizeText(String(formData.get("neighborhood") || ""), 80);
    const seller_name = sanitizeText(String(formData.get("seller_name") || ""), 120);
    const seller_phone = sanitizeText(String(formData.get("seller_phone") || ""), 40);
    const babh_registration_number = sanitizeText(
      String(formData.get("babh_registration_number") || ""),
      80,
    );
    const terms_accepted = formData.get("terms_accepted") === "on";
    const responsibility_accepted =
      formData.get("responsibility_accepted") === "on";

    if (
      !title ||
      !description ||
      !category ||
      !subcategory ||
      !region ||
      !city ||
      !seller_name ||
      !seller_phone
    ) {
      setErrorMessage("Попълни всички задължителни полета.");
      setLoading(false);
      setSubmitStatus("");
      return;
    }

    if (!terms_accepted) {
      setErrorMessage("Трябва да приемеш условията за публикуване.");
      setLoading(false);
      setSubmitStatus("");
      return;
    }

    if (!responsibility_accepted) {
      setErrorMessage("Трябва да потвърдиш, че носиш отговорност за обявата.");
      setLoading(false);
      setSubmitStatus("");
      return;
    }

    const contentValidation = validateBeekeepingListing({
      title,
      description,
      category,
      subcategory,
    });

    if (contentValidation.status === "REJECTED") {
      setValidationReasons(contentValidation.reasons);
      setValidationSuggestions(contentValidation.suggestions);
      setLoading(false);
      setSubmitStatus("");
      return;
    }

    if (!isNegotiable && !priceValue) {
      setErrorMessage("Попълни цена или избери „По договаряне“.");
      setLoading(false);
      setSubmitStatus("");
      return;
    }

    if (priceValue && Number(priceValue) < 0) {
      setErrorMessage("Цената не може да бъде отрицателна.");
      setLoading(false);
      setSubmitStatus("");
      return;
    }

    if (imageFiles.length < 1) {
      setErrorMessage("Качи поне 1 снимка към обявата.");
      setLoading(false);
      setSubmitStatus("");
      return;
    }

    if (imageFiles.length > MAX_LISTING_IMAGES) {
      setErrorMessage("Можеш да качиш максимум 5 снимки към една обява.");
      setLoading(false);
      setSubmitStatus("");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setErrorMessage("Сесията е изтекла. Влез отново.");
      setLoading(false);
      setSubmitStatus("");
      return;
    }

    const imageDataUrls = await Promise.all(
      imageFiles.slice(0, 3).map((file) => fileToDataUrl(file)),
    );

    setSubmitStatus("Проверка и създаване на обявата...");
    const createResponse = await fetch("/api/listings/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        region,
        category,
        subcategory,
        neighborhood: neighborhood || null,
        seller_name,
        seller_phone,
        babh_registration_number,
        city,
        price: isNegotiable ? null : Number(priceValue),
        is_negotiable: isNegotiable,
        terms_accepted,
        responsibility_accepted,
        captchaToken,
        imageCount: imageFiles.length,
        imageDataUrls,
      }),
    });
    const createResult = (await createResponse
      .json()
      .catch(() => null)) as CreateListingResponse | null;

    if (!createResponse.ok || !createResult?.listing?.id) {
      if (createResult?.reasons?.length) {
        setValidationReasons(createResult.reasons);
        setValidationSuggestions(createResult.suggestions || []);
      } else {
        setErrorMessage(
          createResult?.error || "Не успяхме да създадем обявата. Опитай отново.",
        );
      }
      setLoading(false);
      setSubmitStatus("");
      return;
    }
    const createdListing = createResult.listing;
    const uploadedUrls: string[] = [];
    setSubmitStatus("Качване на снимки...");

    for (const file of imageFiles) {
      const validationError = validateListingImage(file);
      if (validationError) {
        setErrorMessage(validationError);
        setLoading(false);
        setSubmitStatus("");
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
        setLoading(false);
        setSubmitStatus("");
        return;
      }

      const uploadResult = await uploadListingImage(supabase, file, userId);

      if (uploadResult.error) {
        setErrorMessage(
          `Обявата е създадена, но снимка не беше качена: ${uploadResult.error.message}`,
        );
        setLoading(false);
        setSubmitStatus("");
        return;
      }

      uploadedUrls.push(uploadResult.publicUrl);
    }

    if (createdListing?.id) {
      const imageRows = uploadedUrls.map((url, index) => ({
        listing_id: createdListing.id,
        url,
        path: null,
        sort_order: index,
      }));

      const { error: imageRowsError } = await supabase
        .from("listing_images")
        .insert(imageRows);

      if (imageRowsError) {
        setErrorMessage(
          `Обявата е създадена, но снимките не бяха записани: ${imageRowsError.message}`,
        );
        setLoading(false);
        setSubmitStatus("");
        return;
      }

      const { error: imageUrlError } = await supabase
        .from("listings")
        .update({ image_url: uploadedUrls[0] })
        .eq("id", createdListing.id);

      if (imageUrlError) {
        setErrorMessage(
          `Обявата е създадена, но основната снимка не беше записана: ${imageUrlError.message}`,
        );
        setLoading(false);
        setSubmitStatus("");
        return;
      }
    }

    setLoading(false);
    setSubmitStatus("");

    if (createdListing.moderation_status === "review") {
      setSuccessMessage(
        "Обявата е изпратена за ръчна проверка. Ще бъде видима след одобрение.",
      );
      setImageFiles([]);
      setImagePreviews([]);
      setCaptchaToken("");
      return;
    }

    router.push("/profile");
    router.refresh();
  }

  if (checkingUser) {
    return (
      <main
        className="min-h-screen bg-cover bg-fixed bg-center text-slate-950"
        style={{ backgroundImage: "url('/bee-background.png')" }}
      >
        <div className="min-h-screen bg-gradient-to-b from-white/80 via-amber-50/55 to-white/80">
          <Header />
          <div className="px-4 py-8">
            <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white/95 p-5 text-sm font-semibold shadow-sm">
              Проверка на профила...
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (loginRequired) {
    return (
      <main
        className="min-h-screen bg-cover bg-fixed bg-center text-slate-950"
        style={{ backgroundImage: "url('/bee-background.png')" }}
      >
        <div className="min-h-screen bg-gradient-to-b from-white/80 via-amber-50/55 to-white/80">
          <Header />
          <div className="px-4 py-8">
            <section className="mx-auto max-w-3xl rounded-2xl border border-amber-100 bg-white/95 p-5 shadow-sm ring-1 ring-white/80 backdrop-blur">
              <h1 className="text-2xl font-black tracking-tight">
                Влез в профила си
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                За да публикуваш обява, трябва първо да влезеш или да създадеш
                профил.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/auth?mode=login&next=/post"
                  className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-amber-600 active:scale-[0.98]"
                >
                  Вход / Регистрация
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Назад към обявите
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  if (profileCheckError) {
    return (
      <main
        className="min-h-screen bg-cover bg-fixed bg-center text-slate-950"
        style={{ backgroundImage: "url('/bee-background.png')" }}
      >
        <div className="min-h-screen bg-gradient-to-b from-white/80 via-amber-50/55 to-white/80">
          <Header />
          <div className="px-4 py-8">
            <section className="mx-auto max-w-3xl rounded-2xl border border-red-100 bg-white/95 p-5 shadow-sm ring-1 ring-white/80 backdrop-blur">
              <h1 className="text-2xl font-black tracking-tight">
                Неуспешна проверка
              </h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-red-700">
                {profileCheckError}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-amber-600 active:scale-[0.98]"
                >
                  Опитай отново
                </button>
                <Link
                  href="/auth?mode=login&next=/post"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Вход / Регистрация
                </Link>
              </div>
            </section>
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
      <div className="min-h-screen bg-gradient-to-b from-white/80 via-amber-50/55 to-white/80">
        <Header />
        <div className="px-4 py-8">
          <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-800"
            >
              <ArrowLeft size={16} />
              Назад към обявите
            </Link>
            <Link
              href="/profile"
              className="rounded-md border border-slate-200 bg-white/95 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Моят профил
            </Link>
          </div>

          <section className="rounded-2xl border border-amber-100 bg-white/95 p-5 shadow-sm ring-1 ring-white/80 backdrop-blur">
            <h1 className="text-2xl font-black tracking-tight">Пусни обява</h1>
            <p className="mt-1 text-sm text-slate-600">
              Попълни ясни данни, за да могат купувачите да се свържат бързо с теб.
            </p>

            {errorMessage ? (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            ) : null}
            {successMessage ? (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
                {successMessage}
              </div>
            ) : null}
            {validationReasons.length > 0 ? (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800">
                <p className="font-black">
                  Обявата не може да бъде публикувана, защото:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {validationReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                {validationSuggestions.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-red-700">
                    {validationSuggestions.map((suggestion) => (
                      <li key={suggestion}>{suggestion}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-bold">Заглавие</span>
                <input
                  name="title"
                  required
                  maxLength={120}
                  placeholder="Например: Акациев мед реколта 2026"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-bold">Описание</span>
                <div className="relative">
                  <textarea
                  name="description"
                  required
                  rows={5}
                  placeholder="Опиши количество, състояние, произход, начин на доставка..."
                  minLength={MIN_LISTING_DESCRIPTION_LENGTH}
                  maxLength={MAX_LISTING_DESCRIPTION_LENGTH}
                  onChange={(event) =>
                    setDescriptionLength(event.target.value.trim().length)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 pb-8 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                  <span
                    className={`absolute bottom-2 right-3 text-xs font-semibold ${
                      descriptionLength < MIN_LISTING_DESCRIPTION_LENGTH
                        ? "text-red-600"
                        : "text-slate-500"
                    }`}
                  >
                    {descriptionLength}/{MAX_LISTING_DESCRIPTION_LENGTH}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Минимум 40 символа, максимум 7000.
                </p>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">Цена (€)</span>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={isNegotiable}
                    placeholder="Остави празно за по договаряне"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </label>
                <label className="flex items-center gap-2 self-end rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={isNegotiable}
                    onChange={(event) => setIsNegotiable(event.target.checked)}
                  />
                  По договаряне
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">Категория</span>
                  <select
                    name="category"
                    required
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  >
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">Подкатегория</span>
                  <select
                    name="subcategory"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  >
                    {(categoryTree[selectedCategory] || []).map((subcategory) => (
                      <option key={subcategory}>{subcategory}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">Област</span>
                  <select
                    name="region"
                    required
                    value={sellerRegion}
                    onChange={(event) => setSellerRegion(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  >
                    {regions.map((region) => (
                      <option key={region}>{region}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">Град</span>
                  <input
                    name="city"
                    required
                    placeholder="Русе"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">Квартал</span>
                  <input
                    name="neighborhood"
                    placeholder="По избор"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-bold">
                  Регистрационен номер към БАБХ
                </span>
                <input
                  name="babh_registration_number"
                  maxLength={80}
                  placeholder="Попълни, ако категорията го изисква"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  Регистрационен номер към БАБХ се изисква само при обяви за мед и пчелни продукти за консумация.
                </span>
              </label>

              <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                <div className="block">
                  <span className="mb-1 block text-sm font-bold">Снимки</span>
                  <label
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 hover:border-amber-400 hover:bg-amber-50"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const files = Array.from(event.dataTransfer.files);
                      if (imageFiles.length + files.length > MAX_LISTING_IMAGES) {
                        setErrorMessage("Можеш да качиш максимум 5 снимки към една обява.");
                        return;
                      }
                      const nextFiles = [...imageFiles, ...files].slice(0, MAX_LISTING_IMAGES);
                      const firstError = nextFiles.map(validateListingImage).find(Boolean);
                      if (firstError) {
                        setErrorMessage(firstError);
                        return;
                      }
                      setImageFiles(nextFiles);
                      setImagePreviews(nextFiles.map((file) => URL.createObjectURL(file)));
                    }}
                  >
                    <span className="font-bold">Пусни снимки тук или избери файлове</span>
                    <span className="mt-1 text-xs">Минимум 1, максимум 5 снимки</span>
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? []);
                        if (imageFiles.length + files.length > MAX_LISTING_IMAGES) {
                          setErrorMessage("Можеш да качиш максимум 5 снимки към една обява.");
                          event.target.value = "";
                          return;
                        }
                        const nextFiles = [...imageFiles, ...files].slice(0, MAX_LISTING_IMAGES);
                        const firstError = nextFiles.map(validateListingImage).find(Boolean);
                        if (firstError) {
                          setErrorMessage(firstError);
                          event.target.value = "";
                          return;
                        }
                        setErrorMessage("");
                        setImageFiles(nextFiles);
                        setImagePreviews(nextFiles.map((file) => URL.createObjectURL(file)));
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <p className="mt-1 text-xs text-slate-500">
                    PNG, JPG или WebP до 10MB на снимка. Първата снимка е основна.
                  </p>
                </div>
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">Срок</span>
                  <select
                    name="duration_days"
                    defaultValue="30"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="30">30 дни</option>
                  </select>
                </label>
              </div>

              {imagePreviews.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={preview}
                      className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt={`Преглед ${index + 1}`}
                        className="h-28 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextFiles = imageFiles.filter((_, itemIndex) => itemIndex !== index);
                          setImageFiles(nextFiles);
                          setImagePreviews(nextFiles.map((file) => URL.createObjectURL(file)));
                        }}
                        className="w-full px-2 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                      >
                        Премахни
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">Име</span>
                  <input
                    name="seller_name"
                    required
                    value={sellerName}
                    onChange={(event) => setSellerName(event.target.value)}
                    placeholder="Иван Иванов"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">Телефон</span>
                  <input
                    name="seller_phone"
                    required
                    value={sellerPhone}
                    onChange={(event) => setSellerPhone(event.target.value)}
                    placeholder="0888123456"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </label>
              </div>

              <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm leading-6 text-slate-700">
                <CheckCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                Обявата ще бъде публикувана към твоя профил. При нужда обнови
                контактите си в страницата на профила.
              </div>
              <p className="rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                Обявите се публикуват от потребители. BeeShop.bg не е страна по
                сделките. Продавачът носи отговорност за съдържанието и
                законността на обявата.
              </p>
              <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <label className="flex items-start gap-2">
                  <input
                    name="terms_accepted"
                    type="checkbox"
                    className="mt-1"
                  />
                  <span>
                    Съгласен съм с{" "}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="font-bold text-blue-700 underline"
                    >
                      условията за публикуване
                    </button>
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    name="responsibility_accepted"
                    type="checkbox"
                    className="mt-1"
                  />
                  <span>
                    Разбирам, че нося пълна отговорност за съдържанието на обявата си.
                  </span>
                </label>
              </div>
<button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 shadow-sm text-sm font-black text-white hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
              >
                <PlusCircle size={17} />
                {loading ? submitStatus || "Публикуване..." : "Публикувай обява"}
              </button>
            </form>
          </section>
          {showTermsModal ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
              <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black">
                    Условия за публикуване
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(false)}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-bold hover:bg-slate-50"
                  >
                    Затвори
                  </button>
                </div>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                  <li>BeeShop.bg е платформа за пчеларски обяви.</li>
                  <li>Продавачите носят отговорност за истинността, законността и безопасността на обявите си.</li>
                  <li>При продажба на мед, пчелни продукти, отводки, майки и живи пчелни семейства, продавачът трябва да спазва приложимите изисквания и регистрации.</li>
                  <li>BeeShop.bg не проверява физически всеки продукт.</li>
                  <li>Заблуждаващи, незаконни, опасни, спам или несвързани обяви могат да бъдат премахвани.</li>
                </ul>
              </div>
            </div>
          ) : null}
          </div>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
