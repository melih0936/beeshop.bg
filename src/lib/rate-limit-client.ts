import type { SupabaseClient } from "@supabase/supabase-js";

export async function checkRateLimit({
  supabase,
  userId,
  action,
  limit,
  windowMinutes,
}: {
  supabase: SupabaseClient;
  userId: string;
  action: "listing_create" | "message_send" | "attachment_upload";
  limit: number;
  windowMinutes: number;
}) {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { count, error: countError } = await supabase
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", since);

  if (countError) {
    return { allowed: true, error: countError.message };
  }

  if ((count ?? 0) >= limit) {
    return {
      allowed: false,
      error: "Твърде много действия за кратко време. Опитай отново след няколко минути.",
    };
  }

  const { error: insertError } = await supabase
    .from("rate_limits")
    .insert({ user_id: userId, action });

  return { allowed: !insertError, error: insertError?.message || "" };
}
