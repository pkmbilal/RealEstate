import Link from "next/link";
import Container from "@/components/layout/Container";
import PageHeader from "@/components/layout/PageHeader";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireRole";
import AdminPropertyActions from "@/components/admin/AdminPropertyActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye, Trash2 } from "lucide-react";

function Tab({ href, active, children }) {
  return (
    <a
      href={href}
      className={[
        "px-3 py-1.5 rounded-lg border text-sm",
        active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted",
      ].join(" ")}
    >
      {children}
    </a>
  );
}

function Field({ label, value }) {
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium text-foreground">{value ?? "—"}</span>
    </div>
  );
}

function AvailabilityBadge({ status }) {
  if (!status || status === "available") return null;
  return (
    <Badge variant="outline" className="shrink-0">
      {String(status).toUpperCase()}
    </Badge>
  );
}

export default async function AdminPropertiesPage({ searchParams }) {
  await requireAdmin();

  const sp = await searchParams;
  const status = sp?.status ?? "all";

  const supabase = await supabaseServer();

  // ✅ 1) PROPERTIES (no embedded joins = most reliable with RLS)
  let query = supabase
    .from("properties")
    .select(
      `
      id,
      title,
      slug,
      price,
      currency,
      city,
      district,
      property_type,
      purpose,
      status,
      availability_status,
      bedrooms,
      bathrooms,
      area_sqm,
      description,
      created_at,
      listed_by_user_id,
      rejection_reason
    `
    )
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);

  const { data: properties, error } = await query;

  // ✅ 2) AGENTS (fetch profiles for those property owners)
  const agentIds = Array.from(
    new Set((properties || []).map((p) => p.listed_by_user_id).filter(Boolean))
  );

  const agentById = {};
  let agentsError = null;

  if (agentIds.length) {
    const { data: agents, error: agentErr } = await supabase
      .from("profiles")
      .select("id, full_name, phone, is_active, role")
      .in("id", agentIds);

    if (agentErr) {
      agentsError = agentErr.message;
    } else {
      for (const a of agents || []) agentById[a.id] = a;
    }
  }

  // ✅ 3) THUMBNAILS (cover images)
  const ids = (properties || []).map((p) => p.id);
  const thumbById = {};

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

  return (
    <Container>
      <PageHeader
        title="All Property Listings"
        subtitle="Browse and manage all property listings"
      />

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Tab href="/dashboard/admin/properties?status=all" active={status === "all"}>
          All
        </Tab>
        <Tab
          href="/dashboard/admin/properties?status=pending"
          active={status === "pending"}
        >
          Pending
        </Tab>
        <Tab
          href="/dashboard/admin/properties?status=published"
          active={status === "published"}
        >
          Published
        </Tab>
        <Tab
          href="/dashboard/admin/properties?status=rejected"
          active={status === "rejected"}
        >
          Rejected
        </Tab>
      </div>

      {error ? <p className="text-sm text-destructive mb-3">{error.message}</p> : null}

      {/* If profiles query blocked by RLS, show message (useful debug) */}
      {agentsError ? (
        <div className="rounded-xl border bg-background p-3 mb-3 text-sm text-destructive">
          Could not load agent profiles: {agentsError}
        </div>
      ) : null}

      {!properties?.length ? (
        <div className="rounded-xl border bg-background p-8 text-center">
          <div className="text-lg font-semibold">No properties found</div>
          <p className="text-sm text-muted-foreground mt-2">
            There are no properties with status "{status}".
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {properties.map((p) => {
            const agent = agentById[p.listed_by_user_id];

            // ✅ Bayut-style display fallback (never looks broken)
            const agentLabel =
              agent?.full_name?.trim() ||
              agent?.phone?.trim() ||
              `ID ${String(p.listed_by_user_id).slice(0, 8)}...`;

            return (
              <div
                key={p.id}
                className="rounded-xl border bg-background overflow-hidden hover:bg-muted/30 transition"
              >
                <div className="grid gap-3 md:grid-cols-[260px_1fr]">
                  {/* Cover image */}
                  {thumbById[p.id] ? (
                    <img
                      src={thumbById[p.id]}
                      alt="Cover"
                      className="w-full h-48 object-cover md:h-full md:min-h-[220px]"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center text-muted-foreground text-sm md:h-full md:min-h-[220px]">
                      No image
                    </div>
                  )}

                  <div className="p-4 flex flex-col gap-3">
                    {/* Title row + badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{p.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {p.currency || ""} {Number(p.price || 0).toLocaleString()} •{" "}
                          {p.city || "—"} {p.district ? `(${p.district})` : ""}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <AvailabilityBadge status={p.availability_status} />
                        <Badge
                          variant={
                            p.status === "published"
                              ? "default"
                              : p.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className="border"
                        >
                          {p.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Property fields */}
                    <div className="grid gap-2 md:grid-cols-2">
                      <Field label="Purpose" value={p.purpose} />
                      <Field label="Type" value={p.property_type} />
                      <Field label="Bedrooms" value={p.bedrooms} />
                      <Field label="Bathrooms" value={p.bathrooms} />
                      <Field label="Area (sqm)" value={p.area_sqm} />
                      <Field label="Availability" value={p.availability_status || "available"} />
                      <Field label="Slug" value={p.slug} />
                      <Field
                        label="Listed"
                        value={new Date(p.created_at).toLocaleDateString()}
                      />
                    </div>

                    {/* Agent info */}
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Agent: </span>
                      {agentLabel}
                      {agent?.full_name?.trim() && agent?.phone?.trim() ? (
                        <span> • {agent.phone}</span>
                      ) : null}
                      {agent?.is_active === false ? (
                        <span className="ml-2 text-xs text-destructive">(Disabled)</span>
                      ) : null}
                    </div>

                    {/* Rejection reason */}
                    {p.status === "rejected" && p.rejection_reason ? (
                      <div className="text-sm">
                        <span className="font-medium text-destructive">
                          Rejection reason:{" "}
                        </span>
                        {p.rejection_reason}
                      </div>
                    ) : null}

                    {/* Description preview */}
                    {p.description ? (
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {p.description}
                      </div>
                    ) : null}

                    {/* Action buttons */}
                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/dashboard/admin/properties/${p.id}`}>
                          <Eye className="h-4 w-4" />
                          Open
                        </Link>
                      </Button>

                      {p.slug && p.status === "published" ? (
                        <Button asChild variant="ghost" size="sm" className="gap-2">
                          <Link href={`/property/${p.slug}`}>
                            <ExternalLink className="h-4 w-4" />
                            View Public
                          </Link>
                        </Button>
                      ) : null}

                      {/* Delete is on detail page (AdminPropertyActions has Delete) */}
                      <Button
                        asChild
                        variant="destructive"
                        size="sm"
                        className="gap-2 ml-auto"
                      >
                        <Link href={`/dashboard/admin/properties/${p.id}`}>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Link>
                      </Button>

                      {/* Moderation actions for pending properties */}
                      {p.status === "pending" ? (
                        <div className="w-full md:w-auto md:ml-auto">
                          <AdminPropertyActions
                            propertyId={p.id}
                            status={p.status}
                            previewHref={`/dashboard/admin/properties/${p.id}`}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
