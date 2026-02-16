import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import LeadForm from "@/components/property/LeadForm";
import FavoriteButton from "@/components/property/FavoriteButton";

export default async function PropertyDetailPage({ params }) {
  const supabase = await supabaseServer();

  // ✅ Next.js new behavior: params is a Promise
  const { slug } = await params;

  const { data: p, error } = await supabase
    .from("properties")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !p) return notFound();

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
    <div style={{ padding: 24 }}>
      <Link href="/search" style={{ textDecoration: "none" }}>
        ← Back to search
      </Link>

      {images?.length ? (
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {images.map((url) => (
            <img
              key={url}
              src={url}
              alt="Property"
              style={{
                width: "100%",
                height: 160,
                objectFit: "cover",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
              }}
            />
          ))}
        </div>
      ) : null}

      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 12 }}>
        {p.title}
      </h1>

      <div style={{ marginTop: 8, opacity: 0.8 }}>
        {p.city || "—"} {p.district ? `• ${p.district}` : ""} • {p.purpose} •{" "}
        {p.property_type}
      </div>

      <div style={{ marginTop: 12, fontSize: 20, fontWeight: 700 }}>
        {p.currency} {p.price}
      </div>

      <div style={{ marginTop: 12, opacity: 0.85 }}>
        {p.bedrooms ?? "—"} bd • {p.bathrooms ?? "—"} ba • {p.area_sqm ?? "—"}{" "}
        sqm
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          {p.currency} {p.price}
        </div>

        <FavoriteButton propertyId={p.id} />
      </div>

      {p.description ? (
        <div style={{ marginTop: 18, lineHeight: 1.6 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Description</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{p.description}</p>
        </div>
      ) : null}

      {/* ✅ Leads (login required) */}
      <LeadForm propertyId={p.id} />
    </div>
  );
}
