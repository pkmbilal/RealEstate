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

  return (
    <div style={{ padding: 24 }}>
      <Link href="/search" style={{ textDecoration: "none" }}>
        ← Back to search
      </Link>

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
