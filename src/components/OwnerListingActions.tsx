"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Edit3 } from "lucide-react";
import DeleteListingButton from "@/components/DeleteListingButton";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase-client";

export default function OwnerListingActions({
  listingId,
  ownerId,
}: {
  listingId: string;
  ownerId: string | null | undefined;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkOwner() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setIsOwner(Boolean(user && ownerId && user.id === ownerId));
        setIsAdmin(isAdminEmail(user?.email));
      }
    }

    checkOwner();

    return () => {
      mounted = false;
    };
  }, [ownerId, supabase]);

  if (!isOwner && !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="rounded-md bg-slate-100 px-3 py-2 text-center text-sm font-bold text-slate-700">
        {isOwner ? "Това е твоя обява" : "Админ действия"}
      </p>
      <Link
        href={`/listings/${listingId}/edit`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
      >
        <Edit3 size={17} />
        {isAdmin && !isOwner ? "Редактирай като админ" : "Редактирай"}
      </Link>
      <DeleteListingButton listingId={listingId} ownerId={ownerId} />
    </div>
  );
}
