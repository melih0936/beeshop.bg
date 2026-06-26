"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase-client";
import {
  categories,
  categoryTree,
  MAX_LISTING_IMAGES,
  type ListingImage,
  regions,
  type Listing,
  validateListingImage,
} from "@/lib/marketplace";
import {
  isBabhRegistrationRequired,
  MAX_LISTING_DESCRIPTION_LENGTH,
  MIN_LISTING_DESCRIPTION_LENGTH,
  validateBeekeepingListing,
} from "@/lib/listing-validation";
import { uploadListingImage } from "@/lib/storage-client";

type ModerationResult = {
  status: "APPROVED" | "REVIEW" | "REJECTED";
  reason: string;
  confidence: number;
};

async function notifyReviewListing(listingId: string, accessToken: string) {
  await fetch("/api/notify-review", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ listingId }),
  }).catch((error) => {
    console.warn("Review notification failed:", error);
  });
}

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

export default function EditListingPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const listingId = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [listing, setListing] = useState<Listing | null>(null);
  const [listingImages, setListingImages] = useState<ListingImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Мед");
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [descriptionLength, setDescriptionLength] = useState(0);
  const [validationReasons, setValidationReasons] = useState<string[]>([]);
  const [validationSuggestions, setValidationSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadListing() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .maybeSingle();

      if (!mounted) {
        return;
      }

      if (error || !data) {
        setErrorMessage("Обявата не е намерена.");
        setLoading(false);
        return;
      }

      const nextListing = data as Listing;

      const isAdmin = isAdminEmail(user.email);

      if (!isAdmin && nextListing.user_id !== user.id) {
        setErrorMessage("Нямаш право да редактираш тази обява.");
        setLoading(false);
        return;
      }

      setListing(nextListing);
      setSelectedCategory(nextListing.category);
      setDescriptionLength((nextListing.description || "").trim().length);

      const { data: imagesData } = await supabase
        .from("listing_images")
        .select("*")
        .eq("listing_id", nextListing.id)
        .order("sort_order", { ascending: true });

      const images = (imagesData ?? []) as ListingImage[];
      setListingImages(
        images.length > 0
          ? images
          : nextListing.image_url
            ? [
                {
                  id: "legacy-main-image",
                  listing_id: nextListing.id,
                  url: nextListing.image_url,
                  path: null,
                  sort_order: 0,
                  created_at: nextListing.created_at,
                },
              ]
            : [],
      );
      setMainImageUrl(nextListing.image_url || images[0]?.url || "");
      setLoading(false);
    }

    loadListing();

    return () => {
      mounted = false;
    };
  }, [listingId, router, supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!listing) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setValidationReasons([]);
    setValidationSuggestions([]);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAdmin = isAdminEmail(user?.email);

    if (!user || (!isAdmin && listing.user_id !== user.id)) {
      router.replace("/auth");
      return;
    }

    const formData = new FormData(form);
    const priceValue = String(formData.get("price") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const category = String(formData.get("category") || "");
    const subcategory = String(formData.get("subcategory") || "");
    const babhRegistrationNumber = String(
      formData.get("babh_registration_number") || "",
    ).trim();
    const keptImages = listingImages.filter(
      (image) => !removedImageIds.includes(image.id),
    );

    if (description.length < MIN_LISTING_DESCRIPTION_LENGTH) {
      setErrorMessage("Описанието трябва да е поне 40 символа.");
      setSaving(false);
      return;
    }

    if (description.length > MAX_LISTING_DESCRIPTION_LENGTH) {
      setErrorMessage("Описанието не може да бъде повече от 7000 символа.");
      setSaving(false);
      return;
    }

    if (
      isBabhRegistrationRequired({ category, subcategory, title, description }) &&
      !babhRegistrationNumber
    ) {
      setErrorMessage("За тази категория е нужен регистрационен номер към БАБХ.");
      setSaving(false);
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
      setSaving(false);
      return;
    }

    if (keptImages.length + newImageFiles.length < 1) {
      setErrorMessage("Обявата трябва да има поне една снимка.");
      setSaving(false);
      return;
    }

    if (keptImages.length + newImageFiles.length > MAX_LISTING_IMAGES) {
      setErrorMessage("Можеш да качиш максимум 5 снимки към една обява.");
      setSaving(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setErrorMessage("Сесията е изтекла. Влез отново.");
      setSaving(false);
      return;
    }

    const imageDataUrls = await Promise.all(
      newImageFiles.slice(0, 3).map((file) => fileToDataUrl(file)),
    );

    const moderationResponse = await fetch("/api/moderate-listing", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        category,
        subcategory,
        city: String(formData.get("city") || "").trim(),
        price: priceValue ? Number(priceValue) : null,
        is_negotiable: !priceValue,
        imageDataUrls,
      }),
    });
    const moderation = (await moderationResponse
      .json()
      .catch(() => null)) as ModerationResult | { error?: string } | null;

    if (!moderationResponse.ok || !moderation || "error" in moderation) {
      setErrorMessage(
        moderation && "error" in moderation && moderation.error
          ? moderation.error
          : "Не успяхме да проверим обявата. Опитай отново.",
      );
      setSaving(false);
      return;
    }
    const moderationResult = moderation as ModerationResult;

    if (moderationResult.status === "REJECTED") {
      setValidationReasons([moderationResult.reason]);
      setValidationSuggestions([]);
      setSaving(false);
      return;
    }

    const uploadedImageRows: Pick<ListingImage, "url" | "path" | "sort_order">[] = [];

    for (const file of newImageFiles) {
      const validationError = validateListingImage(file);
      if (validationError) {
        setErrorMessage(validationError);
        setSaving(false);
        return;
      }

      const uploadResult = await uploadListingImage(supabase, file, user.id);

      if (uploadResult.error) {
        setErrorMessage(`Грешка при качване на снимка: ${uploadResult.error.message}`);
        setSaving(false);
        return;
      }

      uploadedImageRows.push({
        url: uploadResult.publicUrl,
        path: null,
        sort_order: keptImages.length + uploadedImageRows.length,
      });
    }

    const allImageUrls = [
      ...keptImages.map((image) => image.url),
      ...uploadedImageRows.map((image) => image.url),
    ];
    const image_url =
      allImageUrls.includes(mainImageUrl) && !removedImageIds.includes("legacy-main-image")
        ? mainImageUrl
        : allImageUrls[0];

    const { error } = await supabase
      .from("listings")
      .update({
        title,
        description,
        price: priceValue ? Number(priceValue) : null,
        category,
        subcategory,
        region: String(formData.get("region") || ""),
        city: String(formData.get("city") || "").trim(),
        neighborhood: String(formData.get("neighborhood") || "").trim() || null,
        seller_name: String(formData.get("seller_name") || "").trim(),
        seller_phone: String(formData.get("seller_phone") || "").trim(),
        babh_registration_number: babhRegistrationNumber || null,
        image_url,
        moderation_status:
          moderationResult.status === "APPROVED" ? "approved" : "review",
        moderation_reason: moderationResult.reason,
        moderation_confidence: moderationResult.confidence,
        moderated_at: new Date().toISOString(),
      })
      .eq("id", listing.id)
      .eq(isAdmin ? "id" : "user_id", isAdmin ? listing.id : user.id);

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const realRemovedIds = removedImageIds.filter(
      (id) => id !== "legacy-main-image",
    );

    if (realRemovedIds.length > 0) {
      await supabase
        .from("listing_images")
        .delete()
        .in("id", realRemovedIds)
        .eq("listing_id", listing.id);
    }

    if (uploadedImageRows.length > 0) {
      await supabase.from("listing_images").insert(
        uploadedImageRows.map((image) => ({
          listing_id: listing.id,
          url: image.url,
          path: image.path,
          sort_order: image.sort_order,
        })),
      );
    }

    const refreshedUrls = allImageUrls;
    for (const [index, url] of refreshedUrls.entries()) {
      await supabase
        .from("listing_images")
        .update({ sort_order: index })
        .eq("listing_id", listing.id)
        .eq("url", url);
    }

    if (moderationResult.status === "REVIEW") {
      await notifyReviewListing(listing.id, session.access_token);
    }

    router.push(
      moderationResult.status === "REVIEW" ? "/profile" : `/listings/${listing.id}`,
    );
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
            <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white/95 p-5 text-sm font-semibold">
              Зареждане...
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main
        className="min-h-screen bg-cover bg-fixed bg-center text-slate-950"
        style={{ backgroundImage: "url('/bee-background.png')" }}
      >
        <div className="min-h-screen bg-white/70">
          <Header />
          <div className="px-4 py-8">
            <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
              {errorMessage}
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
          <div className="mx-auto max-w-3xl">
            <Link
              href={`/listings/${listing.id}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-800"
            >
              <ArrowLeft size={16} />
              Назад към обявата
            </Link>

            <section className="mt-4 rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
              <h1 className="text-2xl font-black tracking-tight">
                Редактирай обява
              </h1>

              {errorMessage ? (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {errorMessage}
                </div>
              ) : null}
              {validationReasons.length > 0 ? (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800">
                  <p className="font-black">
                    Обявата не може да бъде запазена, защото:
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
                    defaultValue={listing.title}
                    maxLength={120}
                    className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-bold">Описание</span>
                  <textarea
                    name="description"
                    required
                    rows={7}
                    minLength={MIN_LISTING_DESCRIPTION_LENGTH}
                    maxLength={MAX_LISTING_DESCRIPTION_LENGTH}
                    defaultValue={listing.description ?? ""}
                    onChange={(event) =>
                      setDescriptionLength(event.target.value.trim().length)
                    }
                    className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    {descriptionLength}/{MAX_LISTING_DESCRIPTION_LENGTH} символа
                  </span>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">Категория</span>
                    <select
                      name="category"
                      value={selectedCategory}
                      onChange={(event) => setSelectedCategory(event.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">Подкатегория</span>
                    <select
                      name="subcategory"
                      defaultValue={
                        listing.subcategory ?? categoryTree[selectedCategory]?.[0] ?? ""
                      }
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                    >
                      {(categoryTree[selectedCategory] ?? []).map((subcategory) => (
                        <option key={subcategory} value={subcategory}>
                          {subcategory}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">Цена</span>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={
                        listing.is_negotiable || listing.price === null
                          ? ""
                          : String(listing.price)
                      }
                      placeholder="Остави празно за по договаряне"
                      className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">Област</span>
                    <select
                      name="region"
                      required
                      defaultValue={listing.region}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                    >
                      {regions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">Град/село</span>
                    <input
                      name="city"
                      required
                      defaultValue={listing.city ?? ""}
                      className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">Квартал/район</span>
                    <input
                      name="neighborhood"
                      defaultValue={listing.neighborhood ?? ""}
                      className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-sm font-bold">
                    Регистрационен номер към БАБХ
                  </span>
                  <input
                    name="babh_registration_number"
                    defaultValue={listing.babh_registration_number ?? ""}
                    placeholder="Нужен е при мед и пчелни продукти за консумация"
                    className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                  />
                </label>

                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-black">Снимки</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Остави поне 1 снимка. Можеш да добавиш до {MAX_LISTING_IMAGES} общо.
                    </p>
                  </div>

                  {listingImages.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {listingImages.map((image) => {
                        const removed = removedImageIds.includes(image.id);

                        return (
                          <div
                            key={image.id}
                            className={`overflow-hidden rounded-lg border bg-white ${
                              removed ? "border-red-200 opacity-60" : "border-slate-200"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.url}
                              alt="Снимка към обявата"
                              className="h-28 w-full object-cover"
                            />
                            <div className="space-y-2 p-2">
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                <input
                                  type="radio"
                                  name="main_image"
                                  checked={mainImageUrl === image.url && !removed}
                                  disabled={removed}
                                  onChange={() => setMainImageUrl(image.url)}
                                />
                                Основна снимка
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setRemovedImageIds((current) =>
                                    current.includes(image.id)
                                      ? current.filter((id) => id !== image.id)
                                      : [...current, image.id],
                                  );
                                  if (mainImageUrl === image.url) {
                                    const nextImage = listingImages.find(
                                      (item) =>
                                        item.id !== image.id &&
                                        !removedImageIds.includes(item.id),
                                    );
                                    setMainImageUrl(nextImage?.url ?? "");
                                  }
                                }}
                                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                              >
                                {removed ? "Върни снимката" : "Премахни"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-600 hover:border-amber-400 hover:bg-amber-50">
                    <span className="font-bold">Добави нови снимки</span>
                    <span className="mt-1 text-xs">PNG, JPG или WebP до 10MB</span>
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? []);
                        const keptCount = listingImages.filter(
                          (image) => !removedImageIds.includes(image.id),
                        ).length;

                        if (keptCount + newImageFiles.length + files.length > MAX_LISTING_IMAGES) {
                          setErrorMessage("Можеш да качиш максимум 5 снимки към една обява.");
                          event.target.value = "";
                          return;
                        }

                        const firstError = files.map(validateListingImage).find(Boolean);
                        if (firstError) {
                          setErrorMessage(firstError);
                          event.target.value = "";
                          return;
                        }

                        const nextFiles = [...newImageFiles, ...files];
                        setErrorMessage("");
                        setNewImageFiles(nextFiles);
                        setNewImagePreviews(
                          nextFiles.map((file) => URL.createObjectURL(file)),
                        );
                        if (!mainImageUrl && nextFiles.length > 0) {
                          setMainImageUrl(URL.createObjectURL(nextFiles[0]));
                        }
                        event.target.value = "";
                      }}
                    />
                  </label>

                  {newImagePreviews.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {newImagePreviews.map((preview, index) => (
                        <div
                          key={preview}
                          className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preview}
                            alt={`Нова снимка ${index + 1}`}
                            className="h-28 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextFiles = newImageFiles.filter(
                                (_, itemIndex) => itemIndex !== index,
                              );
                              setNewImageFiles(nextFiles);
                              setNewImagePreviews(
                                nextFiles.map((file) => URL.createObjectURL(file)),
                              );
                            }}
                            className="w-full px-2 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                          >
                            Премахни
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">Име</span>
                    <input
                      name="seller_name"
                      required
                      defaultValue={listing.seller_name}
                      className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">Телефон</span>
                    <input
                      name="seller_phone"
                      required
                      defaultValue={listing.seller_phone}
                      className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-3 text-sm font-black text-white hover:bg-amber-600 disabled:opacity-60"
                >
                  <Save size={17} />
                  {saving ? "Запазване..." : "Запази промените"}
                </button>
              </form>
            </section>
          </div>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
