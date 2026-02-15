"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils/slug";
import { toast } from "sonner";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewListingPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    purpose: "rent",
    property_type: "apartment",
    title: "",
    description: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    area_sqm: "",
    city: "",
    district: "",
  });

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onCreate(e) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      toast.error("Please login first.");
      router.push("/auth/login");
      return;
    }

    const slugBase = slugify(form.title || "listing");
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`;

    const payload = {
      slug,
      purpose: form.purpose,
      property_type: form.property_type,
      title: form.title,
      description: form.description || null,
      price: Number(form.price),
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      area_sqm: form.area_sqm ? Number(form.area_sqm) : null,
      city: form.city || null,
      district: form.district || null,
      status: "draft",
      listed_by_user_id: user.id,
    };

    const { data, error } = await supabase
      .from("properties")
      .insert(payload)
      .select("id")
      .single();

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Listing created (draft).");
    router.push(`/dashboard/listings/${data.id}/edit`);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="New Listing" subtitle="Create a draft listing, then publish it when ready." />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={onCreate} className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Select value={form.purpose} onValueChange={(v) => setField("purpose", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Property type</Label>
                <Select value={form.property_type} onValueChange={(v) => setField("property_type", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setField("title", e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={5} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Price (SAR)</Label>
                <Input value={form.price} onChange={(e) => setField("price", e.target.value)} required inputMode="numeric" />
              </div>

              <div className="space-y-2">
                <Label>Area (sqm)</Label>
                <Input value={form.area_sqm} onChange={(e) => setField("area_sqm", e.target.value)} inputMode="numeric" />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Input value={form.bedrooms} onChange={(e) => setField("bedrooms", e.target.value)} inputMode="numeric" />
              </div>

              <div className="space-y-2">
                <Label>Bathrooms</Label>
                <Input value={form.bathrooms} onChange={(e) => setField("bathrooms", e.target.value)} inputMode="numeric" />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setField("city", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>District</Label>
                <Input value={form.district} onChange={(e) => setField("district", e.target.value)} />
              </div>
            </div>

            <Button className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create draft"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
