import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import { supabaseServer } from "@/lib/supabase/server";
import LeadForm from "@/components/property/LeadForm";
import FavoriteButton from "@/components/property/FavoriteButton";
import PropertyGallery from "@/components/property/PropertyGallery";

export default async function PropertyDetailPage({ params }) {
  const supabase = await supabaseServer();

  // ✅ Next.js new behavior: params can be a Promise
  const { slug } = await params;

  const { data: p, error } = await supabase
    .from("properties")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !p) return notFound();

  // ✅ Cover-first gallery (sort_order ASC)
  const { data: media } = await supabase
    .from("property_media")
    .select("path, sort_order, created_at")
    .eq("property_id", p.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const bucket = "property-media";
  const images = (media || []).map((m) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(m.path);
    return data.publicUrl;
  });

  return (
    <Container className="py-6">
      <Link href="/search" className="text-sm text-muted-foreground hover:underline">
        ← Back to search
      </Link>

      {/* ✅ Interactive Gallery */}
      <PropertyGallery images={images} />

      {/* ✅ Title + meta */}
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            {p.title}
          </h1>

          <div className="mt-2 text-sm text-muted-foreground">
            {p.city || "—"}
            {p.district ? ` • ${p.district}` : ""} • {p.purpose} • {p.property_type}
          </div>
        </div>

        <div className="shrink-0">
          <FavoriteButton propertyId={p.id} />
        </div>
      </div>

      {/* ✅ Price */}
      <div className="mt-3 text-xl font-bold">
        {p.currency} {p.price}
      </div>

      {/* ✅ Specs */}
      <div className="mt-2 text-sm text-muted-foreground">
        {p.bedrooms ?? "—"} Bedrooms • {p.bathrooms ?? "—"} Bathrooms •{" "}
        {p.area_sqm ?? "—"} sqm
      </div>

      {/* ✅ Description */}
      {p.description ? (
        <div className="mt-6 rounded-xl border bg-background p-4">
          <div className="font-semibold mb-2">Description</div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-6">
            {p.description}
          </p>
        </div>
      ) : null}

      {/* ✅ Leads (login required) */}
      <div className="mt-6">
        <LeadForm propertyId={p.id} />
      </div>
    </Container>
  );
}
