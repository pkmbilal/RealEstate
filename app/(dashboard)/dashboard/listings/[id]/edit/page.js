"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function EditListingPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [item, setItem] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    setLoading(false);

    if (error) return toast.error(error.message);
    setItem(data);
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function setField(key, value) {
    setItem((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: item.title,
      description: item.description,
      price: Number(item.price),
      bedrooms: item.bedrooms ? Number(item.bedrooms) : null,
      bathrooms: item.bathrooms ? Number(item.bathrooms) : null,
      area_sqm: item.area_sqm ? Number(item.area_sqm) : null,
      city: item.city,
      district: item.district,
    };

    const { error } = await supabase.from("properties").update(payload).eq("id", id);

    setSaving(false);

    if (error) return toast.error(error.message);
    toast.success("Saved.");
  }

  async function togglePublish() {
    const next = item.status === "published" ? "draft" : "published";
    setPublishing(true);

    const payload =
      next === "published"
        ? { status: "published", published_at: new Date().toISOString() }
        : { status: "draft", published_at: null };

    const { error } = await supabase.from("properties").update(payload).eq("id", id);

    setPublishing(false);

    if (error) return toast.error(error.message);

    toast.success(next === "published" ? "Published!" : "Unpublished.");
    load();
  }

  if (loading) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (!item) return <div className="text-sm text-muted-foreground">Not found.</div>;

  const isPublished = item.status === "published";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Edit Listing"
        subtitle="Update listing details and publish when ready."
        right={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="border text-primary">
              {item.status}
            </Badge>
            <Button
              variant={isPublished ? "outline" : "default"}
              onClick={togglePublish}
              disabled={publishing}
            >
              {publishing ? "Updating..." : isPublished ? "Unpublish" : "Publish"}
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={onSave} className="grid gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={item.title || ""} onChange={(e) => setField("title", e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={item.description || ""} onChange={(e) => setField("description", e.target.value)} rows={6} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Price (SAR)</Label>
                <Input value={item.price ?? ""} onChange={(e) => setField("price", e.target.value)} inputMode="numeric" />
              </div>

              <div className="space-y-2">
                <Label>Area (sqm)</Label>
                <Input value={item.area_sqm ?? ""} onChange={(e) => setField("area_sqm", e.target.value)} inputMode="numeric" />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Input value={item.bedrooms ?? ""} onChange={(e) => setField("bedrooms", e.target.value)} inputMode="numeric" />
              </div>

              <div className="space-y-2">
                <Label>Bathrooms</Label>
                <Input value={item.bathrooms ?? ""} onChange={(e) => setField("bathrooms", e.target.value)} inputMode="numeric" />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={item.city || ""} onChange={(e) => setField("city", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>District</Label>
                <Input value={item.district || ""} onChange={(e) => setField("district", e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard/listings")}>
                Back
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
