import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation, Message } from "@/lib/marketplace";

export async function getUnreadMessagesCount(
  supabase: SupabaseClient,
  userId: string,
) {
  const [
    { data: buyerConversations, error: buyerError },
    { data: sellerConversations, error: sellerError },
  ] = await Promise.all([
    supabase
      .from("conversations")
      .select("id,buyer_id,seller_id,listing_id,created_at")
      .eq("buyer_id", userId),
    supabase
      .from("conversations")
      .select("id,buyer_id,seller_id,listing_id,created_at")
      .eq("seller_id", userId),
  ]);

  if (buyerError || sellerError) {
    return 0;
  }

  const conversations = [
    ...((buyerConversations ?? []) as Conversation[]),
    ...((sellerConversations ?? []) as Conversation[]),
  ].filter(
    (conversation, index, all) =>
      all.findIndex((item) => item.id === conversation.id) === index,
  );

  const conversationIds = conversations.map((conversation) => conversation.id);

  if (conversationIds.length === 0) {
    return 0;
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id")
    .in("conversation_id", conversationIds)
    .neq("sender_id", userId)
    .is("read_at", null);

  if (error) {
    return 0;
  }

  return ((data ?? []) as Pick<Message, "id">[]).length;
}

export async function markConversationAsRead(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
) {
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);

  return error;
}
