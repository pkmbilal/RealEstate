import Link from "next/link";
import { redirect } from "next/navigation";
import Container from "@/components/layout/Container";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAgentOrAdmin } from "@/lib/auth/requireRole";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, ExternalLink } from "lucide-react";

function Field({ label, value }) {
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium text-foreground">{value ?? "—"}</span>
    </div>
  );
}

export default async function ListingsPage() {
  await requireAgentOrAdmin();

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // ✅ Select all useful fields (edit this list if you add more columns later)
  const { data: listings, error } = await supabase
    .from("properties")
    .select(
      `
      id,
      slug,
      purpose,
      property_type,
      title,
      description,
      price,
      currency,
      bedrooms,
      bathrooms,
      area_sqm,
      city,
      district,
      status,
      published_at,
      created_at,
      updated_at
    `,
    )
    .eq("listed_by_user_id", user.id)
    .order("created_at", { ascending: false });

  // ✅ Thumbnails (same as search)
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
      <div className="space-y-4">
        <PageHeader
          title="My Listings"
          subtitle="Create and manage your property listings."
          right={
            <Button asChild className="gap-2">
              <Link href="/dashboard/listings/new">
                <Plus className="h-4 w-4" />
                New Listing
              </Link>
            </Button>
          }
        />

        {error ? (
          <p className="text-sm text-red-600">Error: {error.message}</p>
        ) : null}

        {!listings?.length ? (
          <div className="rounded-xl border bg-background p-8 text-center">
            <div className="text-lg font-semibold">No listings yet</div>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first listing to start receiving leads.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/dashboard/listings/new">Create listing</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {listings.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border bg-background overflow-hidden hover:bg-muted/30 transition"
              >
                <div className="grid gap-3 md:grid-cols-[260px_1fr]">
                  {/* Image */}
                  {thumbById[p.id] ? (
                    <img
                      src={thumbById[p.id]}
                      alt="Thumb"
                      className="w-full h-48 object-cover md:h-full md:min-h-[220px]"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted md:h-full md:min-h-[220px]" />
                  )}

                  {/* Details */}
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{p.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {p.currency} {p.price} • {p.city || "—"}{" "}
                          {p.district ? `(${p.district})` : ""}
                        </div>

                        {/* Description */}
                        {p.description ? (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {p.description}
                          </div>
                        ) : null}
                      </div>

                      <Badge
                        variant="secondary"
                        className="border text-primary shrink-0"
                      >
                        {p.status}
                      </Badge>
                    </div>

                    {/* ✅ “All fields” block */}
                    <div className="grid gap-2 md:grid-cols-2">
                      <Field label="Purpose" value={p.purpose} />
                      <Field label="Type" value={p.property_type} />
                      <Field label="Bedrooms" value={p.bedrooms} />
                      <Field label="Bathrooms" value={p.bathrooms} />
                      <Field label="Area (sqm)" value={p.area_sqm} />
                      <Field label="City" value={p.city} />
                      <Field label="District" value={p.district} />
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button asChild variant="outline" className="gap-2">
                        <Link href={`/dashboard/listings/${p.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Link>
                      </Button>

                      {p.status === "published" && p.slug ? (
                        <Button asChild variant="ghost" className="gap-2">
                          <Link href={`/property/${p.slug}`}>
                            <ExternalLink className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
