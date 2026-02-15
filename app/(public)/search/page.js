import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import FavoriteButton from "@/components/property/FavoriteButton";

export default async function SearchPage() {
  const supabase = await supabaseServer();

  const { data: listings, error } = await supabase
    .from("properties")
    .select(
      "id, slug, title, price, currency, city, district, bedrooms, bathrooms, area_sqm, created_at",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        Search
      </h1>

      {error ? (
        <pre style={{ color: "crimson" }}>{JSON.stringify(error, null, 2)}</pre>
      ) : null}

      {!listings?.length ? (
        <p>No published listings yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {listings.map((p) => (
            <Link
              key={p.id}
              href={`/property/${p.slug}`}
              style={{
                display: "block",
                padding: 14,
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ fontWeight: 600 }}>{p.title}</div>
              <div style={{ opacity: 0.75, marginTop: 4 }}>
                {p.currency} {p.price} • {p.city || "—"}{" "}
                {p.district ? `(${p.district})` : ""}
              </div>
              <div style={{ opacity: 0.75, marginTop: 4 }}>
                {p.bedrooms ?? "—"} bd • {p.bathrooms ?? "—"} ba •{" "}
                {p.area_sqm ?? "—"} sqm
              </div>
              <div style={{ marginTop: 10 }}>
                <FavoriteButton propertyId={p.id} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
