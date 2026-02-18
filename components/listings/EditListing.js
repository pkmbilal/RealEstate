"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditListing({ listing }) {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const status = listing?.status || "draft";

  const initial = useMemo(() => {
    return {
      purpose: listing?.purpose || "rent",
      property_type: listing?.property_type || "apartment",
      availability_status: listing?.availability_status || "available",
      title: listing?.title || "",
      description: listing?.description || "",
      price: listing?.price ?? "",
      bedrooms: listing?.bedrooms ?? "",
      bathrooms: listing?.bathrooms ?? "",
      area_sqm: listing?.area_sqm ?? "",
      city: listing?.city || "",
      district: listing?.district || "",
    };
  }, [listing]);

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit = status === "draft" || status === "rejected";

  function buildChangesPayload() {
    return {
      purpose: form.purpose,
      property_type: form.property_type,
      availability_status: form.availability_status,
      title: form.title,
      description: form.description || null,
      price: form.price === "" ? null : Number(form.price),
      bedrooms: form.bedrooms === "" ? null : Number(form.bedrooms),
      bathrooms: form.bathrooms === "" ? null : Number(form.bathrooms),
      area_sqm: form.area_sqm === "" ? null : Number(form.area_sqm),
      city: form.city || null,
      district: form.district || null,
    };
  }

  async function save() {
    try {
      setSaving(true);

      const changes = buildChangesPayload();

      // ✅ Published listing: store changes as pending_changes for admin review
      if (status === "published") {
        const payload = {
          status: "pending",
          pending_changes: changes,
          rejection_reason: null,
          // ✅ keep published_at as-is (so listing still shows published date)
          // published_at: listing?.published_at ?? null,
        };

        const { error } = await supabase
          .from("properties")
          .update(payload)
          .eq("id", listing.id);

        if (error) throw error;

        toast.success("Changes saved and sent for approval ✅");
        router.refresh();
        return;
      }

      // ✅ Draft / Pending / Rejected: update real columns directly
      // if pending already, keep pending; else save as draft
      const nextStatus = status === "pending" ? "pending" : "draft";

      const payload = {
        ...changes,
        status: nextStatus,
        pending_changes: null,
      };

      const { error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", listing.id);

      if (error) throw error;

      toast.success("Saved.");
      router.refresh();
    } catch (e) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function submitForApproval() {
    try {
      setSubmitting(true);

      if (!form.title?.trim()) throw new Error("Title is required");
      if (!form.price || Number(form.price) <= 0) throw new Error("Valid price is required");
      if (!form.city?.trim()) throw new Error("City is required");

      const changes = buildChangesPayload();

      // ✅ submit draft/rejected/pending as pending for admin review
      const payload = {
        ...changes,
        status: "pending",
        rejection_reason: null,
        pending_changes: null, // because changes are already applied to main columns
      };

      const { error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", listing.id);

      if (error) throw error;

      toast.success("Submitted for admin approval ✅");
      router.refresh();
    } catch (e) {
      toast.error(e?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Edit Listing"
        subtitle={
          status === "published"
            ? "Edits to a published listing will be reviewed by admin."
            : "Save changes or submit for approval."
        }
        right={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge variant="secondary" className="border text-primary">
              {status}
            </Badge>

            <Button variant="outline" disabled={saving} onClick={save}>
              {saving ? "Saving..." : status === "published" ? "Save changes" : "Save"}
            </Button>

            {canSubmit ? (
              <Button disabled={submitting} onClick={submitForApproval}>
                {submitting ? "Submitting..." : "Submit for approval"}
              </Button>
            ) : null}
          </div>
        }
      />

      {status === "rejected" && listing?.rejection_reason ? (
        <div className="rounded-xl border bg-background p-4">
          <div className="text-sm font-medium">Rejected reason</div>
          <div className="text-sm text-muted-foreground mt-1">
            {listing.rejection_reason}
          </div>
        </div>
      ) : null}

      <Card>
        <CardContent className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="grid gap-4"
          >
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Select value={form.purpose} onValueChange={(v) => setField("purpose", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Property type</Label>
                <Select
                  value={form.property_type}
                  onValueChange={(v) => setField("property_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Availability</Label>
                <Select
                  value={form.availability_status}
                  onValueChange={(v) => setField("availability_status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={5}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Price (SAR)</Label>
                <Input
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  required
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-2">
                <Label>Area (sqm)</Label>
                <Input
                  value={form.area_sqm}
                  onChange={(e) => setField("area_sqm", e.target.value)}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Input
                  value={form.bedrooms}
                  onChange={(e) => setField("bedrooms", e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label>Bathrooms</Label>
                <Input
                  value={form.bathrooms}
                  onChange={(e) => setField("bathrooms", e.target.value)}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setField("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>District</Label>
                <Input
                  value={form.district}
                  onChange={(e) => setField("district", e.target.value)}
                />
              </div>
            </div>

            <Button className="w-full" disabled={saving} type="submit">
              {saving ? "Saving..." : status === "published" ? "Save changes" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
