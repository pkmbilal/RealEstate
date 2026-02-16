import Link from "next/link";
import Container from "@/components/layout/Container";
import { supabaseServer } from "@/lib/supabase/server";
import FavoriteButton from "@/components/property/FavoriteButton";

export default async function SearchPage({ searchParams }) {
  const supabase = await supabaseServer();

  // ✅ Next.js newer versions: searchParams can be a Promise
  const sp = await searchParams;

  const purpose = sp?.purpose || ""; // rent | sale
  const city = sp?.city || "";
  const min = sp?.min ? Number(sp.min) : null;
  const max = sp?.max ? Number(sp.max) : null;
  const beds = sp?.beds ? Number(sp.beds) : null;
  const type = sp?.type || ""; // apartment | villa | land | office

  let q = supabase
    .from("properties")
    .select(
      "id, slug, title, price, currency, city, district, bedrooms, bathrooms, area_sqm, created_at"
    )
    .eq("status", "published");

  if (purpose) q = q.eq("purpose", purpose);
  if (type) q = q.eq("property_type", type);
  if (city) q = q.ilike("city", city); // case-insensitive
  if (min !== null && !Number.isNaN(min)) q = q.gte("price", min);
  if (max !== null && !Number.isNaN(max)) q = q.lte("price", max);
  if (beds !== null && !Number.isNaN(beds)) q = q.gte("bedrooms", beds);

  const { data: listings, error } = await q.order("published_at", { ascending: false });

  // ✅ Thumbnails
  const ids = (listings || []).map((p) => p.id);
  let thumbById = {};

  if (ids.length) {
    const { data: media } = await supabase
      .from("property_media")
      .select("property_id, path, created_at")
      .in("property_id", ids)
      .order("created_at", { ascending: true });

    const bucket = "property-media";
    for (const m of media || []) {
      if (!thumbById[m.property_id]) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(m.path);
        thumbById[m.property_id] = data.publicUrl;
      }
    }
  }

  return (
    <Container className="py-6">
      <h1 className="text-2xl font-bold mb-4">Search</h1>

      {/* ✅ Filters */}
      <div className="mb-4 rounded-xl border bg-background p-3">
        <form className="grid gap-3 md:grid-cols-6" action="/search">
          <select
            name="purpose"
            defaultValue={purpose}
            className="h-10 rounded-lg border px-3"
          >
            <option value="">Purpose</option>
            <option value="rent">Rent</option>
            <option value="sale">Sale</option>
          </select>

          <input
            name="city"
            defaultValue={city}
            placeholder="City"
            className="h-10 rounded-lg border px-3"
          />

          <select
            name="type"
            defaultValue={type}
            className="h-10 rounded-lg border px-3"
          >
            <option value="">Type</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="land">Land</option>
            <option value="office">Office</option>
          </select>

          <input
            name="min"
            defaultValue={sp?.min || ""}
            placeholder="Min price"
            inputMode="numeric"
            className="h-10 rounded-lg border px-3"
          />

          <input
            name="max"
            defaultValue={sp?.max || ""}
            placeholder="Max price"
            inputMode="numeric"
            className="h-10 rounded-lg border px-3"
          />

          <select
            name="beds"
            defaultValue={sp?.beds || ""}
            className="h-10 rounded-lg border px-3"
          >
            <option value="">Beds</option>
            <option value="0">Studio+</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>

          <button className="md:col-span-6 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-[var(--hover)]">
            Apply filters
          </button>
        </form>

        <div className="mt-3 text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{listings?.length || 0}</span>{" "}
          result(s)
          {" • "}
          <Link className="underline" href="/search">
            Clear
          </Link>
        </div>
      </div>

      {error ? (
        <pre className="text-red-600">{JSON.stringify(error, null, 2)}</pre>
      ) : null}

      {!listings?.length ? (
        <p>No matching listings.</p>
      ) : (
        <div className="grid gap-4">
          {listings.map((p) => (
            <Link
              key={p.id}
              href={`/property/${p.slug}`}
              className="block rounded-xl border bg-background hover:bg-muted/30 transition overflow-hidden"
            >
              <div className="grid gap-3 md:grid-cols-[260px_1fr]">
                {thumbById[p.id] ? (
                  <img
                    src={thumbById[p.id]}
                    alt="Thumb"
                    className="w-full h-48 object-cover md:h-full md:min-h-[170px]"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted md:h-full md:min-h-[170px]" />
                )}

                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{p.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {p.currency} {p.price} • {p.city || "—"}{" "}
                        {p.district ? `(${p.district})` : ""}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {p.bedrooms ?? "—"} bd • {p.bathrooms ?? "—"} ba •{" "}
                        {p.area_sqm ?? "—"} sqm
                      </div>
                    </div>

                    <div className="shrink-0">
                      <FavoriteButton propertyId={p.id} />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mt-auto">
                    Tap to view details
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
