"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SNAPSHOT_FIELDS = [
  "purpose",
  "property_type",
  "availability_status",
  "title",
  "description",
  "price",
  "bedrooms",
  "bathrooms",
  "area_sqm",
  "city",
  "district",
];

export default function AdminPropertyActions({
  propertyId,
  status,
  previewHref,
}) {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const approve = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1) Fetch current row (for snapshot + pending changes)
      const { data: row, error: fetchErr } = await supabase
        .from("properties")
        .select(`status, pending_changes, ${SNAPSHOT_FIELDS.join(",")}`)
        .eq("id", propertyId)
        .single();

      if (fetchErr) throw fetchErr;

      const pending = row?.pending_changes || {};
      const snapshot = {};

      // Snapshot should represent the last “live” version BEFORE approval applies pending
      for (const k of SNAPSHOT_FIELDS) snapshot[k] = row?.[k] ?? null;

      // 2) Apply pending changes if present
      const payload = {
        ...pending,
        pending_changes: null,
        status: "published",
        rejection_reason: null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id || null,
        published_at: new Date().toISOString(),
        last_published_snapshot: snapshot,
      };

      const { error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", propertyId);

      if (error) throw error;

      router.refresh();
    } catch (e) {
      alert(e?.message || "Failed to approve property");
    } finally {
      setLoading(false);
    }
  };

  const reject = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload = {
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id || null,
        rejection_reason: reason || "Not specified",
      };

      const { error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", propertyId);

      if (error) throw error;

      router.refresh();
    } catch (e) {
      alert(e?.message || "Failed to reject property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2 min-w-[240px]">
      {status === "pending" ? (
        <>
          <Button disabled={loading} onClick={approve} className="w-full">
            {loading ? "Approving..." : "Approve"}
          </Button>

          <div className="w-full space-y-2">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Rejection reason (optional)"
            />
            <Button
              variant="destructive"
              disabled={loading}
              onClick={reject}
              className="w-full"
            >
              {loading ? "Rejecting..." : "Reject"}
            </Button>
          </div>
        </>
      ) : (
        <Button variant="outline" disabled className="w-full">
          {String(status).toUpperCase()}
        </Button>
      )}

      {previewHref ? (
        <a className="text-xs underline text-muted-foreground" href={previewHref}>
          Preview / review
        </a>
      ) : null}
    </div>
  );
}
