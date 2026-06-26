type ReviewEmailListing = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  seller_name?: string | null;
  seller_phone?: string | null;
  moderation_reason?: string | null;
};

function getAdminRecipients() {
  return (
    process.env.ADMIN_REVIEW_EMAILS ||
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    ""
  )
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendReviewNotificationEmail(
  listing: ReviewEmailListing,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipients = getAdminRecipients();

  if (!apiKey || recipients.length === 0) {
    console.warn(
      "Review email not sent: RESEND_API_KEY or admin recipient email is missing.",
    );
    return { sent: false, skipped: true };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const adminUrl = `${siteUrl.replace(/\/$/, "")}/admin/moderation`;
  const from =
    process.env.REVIEW_EMAIL_FROM || "BeeShop.bg <onboarding@resend.dev>";
  const category = [listing.category, listing.subcategory]
    .filter(Boolean)
    .join(" / ");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: `Нова обява чака проверка: ${listing.title}`,
      text: [
        "Нова обява чака ръчна проверка в BeeShop.bg.",
        "",
        `Заглавие: ${listing.title}`,
        `Категория: ${category || "-"}`,
        `Продавач: ${listing.seller_name || "-"}`,
        `Телефон: ${listing.seller_phone || "-"}`,
        `Причина: ${listing.moderation_reason || "Чака проверка."}`,
        "",
        "Описание:",
        listing.description || "-",
        "",
        `Преглед: ${adminUrl}`,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
          <h2>Нова обява чака проверка</h2>
          <p><strong>Заглавие:</strong> ${escapeHtml(listing.title)}</p>
          <p><strong>Категория:</strong> ${escapeHtml(category || "-")}</p>
          <p><strong>Продавач:</strong> ${escapeHtml(listing.seller_name || "-")}</p>
          <p><strong>Телефон:</strong> ${escapeHtml(listing.seller_phone || "-")}</p>
          <p><strong>Причина:</strong> ${escapeHtml(listing.moderation_reason || "Чака проверка.")}</p>
          <p><strong>Описание:</strong></p>
          <p>${escapeHtml(listing.description || "-")}</p>
          <p><a href="${adminUrl}">Отвори модерация</a></p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    console.warn("Review email failed:", response.status, message);
    return { sent: false, skipped: false };
  }

  return { sent: true, skipped: false };
}
