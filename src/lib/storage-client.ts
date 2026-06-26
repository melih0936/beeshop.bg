import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadListingImage(
  supabase: SupabaseClient,
  file: File,
  userId: string,
) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("listing-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return { publicUrl: "", error };
  }

  const { data } = supabase.storage.from("listing-images").getPublicUrl(path);

  return { publicUrl: data.publicUrl, error: null };
}

export async function uploadMessageAttachment(
  supabase: SupabaseClient,
  file: File,
  userId: string,
) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("message-attachments")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return { publicUrl: "", error };
  }

  const { data } = supabase.storage
    .from("message-attachments")
    .getPublicUrl(path);

  return { publicUrl: data.publicUrl, error: null };
}
