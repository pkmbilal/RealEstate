import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function FavoritesPage() {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rows, error } = await supabase
    .from("favorites")
    .select(`
      created_at,
      property:properties (
        id, slug, title, price, currency, city, district, bedrooms, bathrooms, area_sqm, status
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const favorites = (rows || [])
    .map((r) => r.property)
    .filter((p) => !!p);

  return (
    <div style={{ padding: 6 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
        Favorites
      </h1>

      {error ? (
        <pre style={{ color: "crimson" }}>{JSON.stringify(error, null, 2)}</pre>
      ) : null}

      {!favorites.length ? (
        <p>No favorites yet. Go to <Link href="/search">Search</Link> and save some ❤️</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {favorites.map((p) => (
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
              <div style={{ fontWeight: 700 }}>{p.title}</div>
              <div style={{ opacity: 0.75, marginTop: 4 }}>
                {p.currency} {p.price} • {p.city || "—"} {p.district ? `(${p.district})` : ""}
              </div>
              <div style={{ opacity: 0.75, marginTop: 4 }}>
                {p.bedrooms ?? "—"} bd • {p.bathrooms ?? "—"} ba • {p.area_sqm ?? "—"} sqm
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
