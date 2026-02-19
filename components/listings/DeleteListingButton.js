"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteListingButton({
  propertyId,
  canDelete,
  mediaPaths = [],
  redirectTo = "/dashboard/listings",
}) {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onDelete() {
    setError("");
    setLoading(true);

    try {
      // 1) remove storage files (optional)
      if (mediaPaths?.length) {
        const { error: storageErr } = await supabase.storage
          .from("property-media")
          .remove(mediaPaths);

        // don’t hard-fail if storage delete fails
        if (storageErr) console.warn("Storage cleanup failed:", storageErr.message);
      }

      // 2) delete via RPC (authoritative permission check)
      const { error: rpcErr } = await supabase.rpc("delete_property", {
        p_property_id: propertyId,
      });

      if (rpcErr) throw rpcErr;

      router.push(redirectTo);
      router.refresh();
    } catch (e) {
      setError(e?.message || "Failed to delete listing");
    } finally {
      setLoading(false);
    }
  }

  if (!canDelete) return null;

  return (
    <div className="mt-6">
      <div className="rounded-xl border p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">Delete listing</p>
            <p className="text-sm text-muted-foreground">
              This will permanently remove the listing and related media/leads.
            </p>
            {error ? (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={loading}>
                <Trash2 className="mr-2 h-4 w-4" />
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The listing and its related data will be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  disabled={loading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Confirm delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
