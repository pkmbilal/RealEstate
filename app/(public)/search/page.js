import Link from "next/link";
import Container from "@/components/layout/Container";
import { supabaseServer } from "@/lib/supabase/server";
import FavoriteButton from "@/components/property/FavoriteButton";

function AvailabilityBadge({ status }) {
  if (!status || status === "available") return null;

  const label = status.toUpperCase();

  return (
    <span className="rounded-md border px-2 py-1 text-xs font-medium">
      {label}
    </span>
  );
}

export default async function SearchPage({ searchParams }) {
  const supabase = await supabaseServer();
  const sp = await searchParams;

  // ---------- helpers ----------
  const toNum = (v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(String(v).replace(/,/g, "").trim());
    return Number.isNaN(n) ? null : n;
  };

  const purpose = (sp?.purpose || "").trim();
  const city = (sp?.city || "").trim();
  const district = (sp?.district || "").trim();
  const type = (sp?.type || "").trim();

  let min = toNum(sp?.min);
  let max = toNum(sp?.max);
  const beds = toNum(sp?.beds);

  if (min !== null && max !== null && min > max) {
    const t = min;
    min = max;
    max = t;
  }

  // ✅ sort
  const sort = (sp?.sort || "newest").trim(); // newest | price_asc | price_desc

  // ---------- pagination ----------
  const PAGE_SIZE = 10;
  const page = Math.max(1, toNum(sp?.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // ---------- build query ----------
  let q = supabase
    .from("properties")
    .select(
      "id, slug, title, price, currency, city, district, bedrooms, bathrooms, area_sqm, created_at, published_at, availability_status",
      { count: "exact" }
    )
    .eq("status", "published");

  if (purpose) q = q.eq("purpose", purpose);
  if (type) q = q.eq("property_type", type);
  if (city) q = q.ilike("city", `%${city}%`);
  if (district) q = q.ilike("district", `%${district}%`);
  if (min !== null) q = q.gte("price", min);
  if (max !== null) q = q.lte("price", max);
  if (beds !== null) q = q.gte("bedrooms", beds);

  // ✅ apply sort
  if (sort === "price_asc") {
    q = q.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    q = q.order("price", { ascending: false });
  } else {
    q = q.order("published_at", { ascending: false }); // newest default
  }

  // pagination range
  const { data: listings, error, count } = await q.range(from, to);

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  // ---------- thumbnails for THIS PAGE (✅ cover image = lowest sort_order) ----------
  const ids = (listings || []).map((p) => p.id);
  let thumbById = {};

  if (ids.length) {
    const { data: media } = await supabase
      .from("property_media")
      .select("property_id, path, sort_order, created_at")
      .in("property_id", ids)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    const bucket = "property-media";
    for (const m of media || []) {
      if (!thumbById[m.property_id]) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(m.path);
        thumbById[m.property_id] = data.publicUrl;
      }
    }
  }

  // ---------- helper to build URLs while keeping filters ----------
  const buildUrl = (nextPage) => {
    const params = new URLSearchParams();

    if (purpose) params.set("purpose", purpose);
    if (city) params.set("city", city);
    if (district) params.set("district", district);
    if (type) params.set("type", type);
    if (min !== null) params.set("min", String(min));
    if (max !== null) params.set("max", String(max));
    if (beds !== null) params.set("beds", String(beds));
    if (sort) params.set("sort", sort);

    params.set("page", String(nextPage));
    return `/search?${params.toString()}`;
  };

  return (
    <Container className="py-6">
      <h1 className="text-2xl font-bold mb-4">Search</h1>

      {/* ✅ Filters + Sort */}
      <div className="mb-4 rounded-xl border bg-background p-3">
        <form className="grid gap-3 md:grid-cols-7" action="/search">
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

          <select
            name="sort"
            defaultValue={sort}
            className="h-10 rounded-lg border px-3"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price (Low → High)</option>
            <option value="price_desc">Price (High → Low)</option>
          </select>

          {/* reset page when applying filters */}
          <input type="hidden" name="page" value="1" />

          <button className="md:col-span-7 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-[var(--hover)]">
            Apply
          </button>
        </form>

        <div className="mt-3 text-sm text-muted-foreground flex flex-wrap items-center gap-2">
          <span>
            Showing{" "}
            <span className="font-medium text-foreground">
              {total ? `${from + 1}-${Math.min(from + PAGE_SIZE, total)}` : 0}
            </span>{" "}
            of <span className="font-medium text-foreground">{total}</span>
          </span>
          <span>•</span>
          <span>
            Page <span className="font-medium text-foreground">{page}</span> /{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </span>
          <span>•</span>
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
        <>
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
                        <div className="flex items-center gap-2">
                          <div className="font-semibold truncate">{p.title}</div>
                          <AvailabilityBadge status={p.availability_status} />
                        </div>

                        <div className="text-sm text-muted-foreground mt-1">
                          {p.currency} {p.price} • {p.city || "—"}{" "}
                          {p.district ? `(${p.district})` : ""}
                        </div>

                        <div className="text-sm text-muted-foreground mt-1">
                          {p.bedrooms ?? "—"} Bedrooms • {p.bathrooms ?? "—"} Bathrooms •{" "}
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

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            {hasPrev ? (
              <Link
                href={buildUrl(page - 1)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}

            {hasNext ? (
              <Link
                href={buildUrl(page + 1)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
              >
                Next →
              </Link>
            ) : (
              <span />
            )}
          </div>
        </>
      )}
    </Container>
  );
}
