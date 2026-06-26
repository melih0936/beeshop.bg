"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase-client";

export default function DeleteListingButton({
  listingId,
  ownerId,
  compact = false,
}: {
  listingId: string;
  ownerId: string | null | undefined;
  compact?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function deleteListing() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    const isAdmin = isAdminEmail(user.email);

    if (!isAdmin && (!ownerId || user.id !== ownerId)) {
      alert("Нямаш право да изтриеш тази обява.");
      return;
    }

    const confirmed = window.confirm(
      "Сигурен ли си, че искаш да изтриеш обявата?",
    );
    if (!confirmed) {
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId);

    setLoading(false);

    if (error) {
      alert(`Грешка при изтриване: ${error.message}`);
      return;
    }

    router.push(isAdmin ? "/" : "/profile");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={deleteListing}
      disabled={loading}
      className={
        compact
          ? "inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
          : "inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 hover:bg-red-100 disabled:opacity-60"
      }
    >
      <Trash2 size={16} />
      {loading ? "Изтриване..." : "Изтрий"}
    </button>
  );
}
