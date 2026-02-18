import Container from "@/components/layout/Container";
import PageHeader from "@/components/layout/PageHeader";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireRole";
import { notFound } from "next/navigation";

function Row({ label, left, right }) {
  const changed = String(left ?? "") !== String(right ?? "");
  return (
    <div className="grid grid-cols-3 gap-3 text-sm py-2 border-b">
      <div className="text-muted-foreground">{label}</div>
      <div className={changed ? "line-through text-muted-foreground" : ""}>
        {left ?? "—"}
      </div>
      <div className={changed ? "font-medium" : "text-muted-foreground"}>
        {right ?? "—"}
      </div>
    </div>
  );
}

export default async function AdminPropertyPreviewPage({ params }) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await supabaseServer();

  const { data: p, error } = await supabase
    .from("properties")
    .select(
      `
      id,
      status,
      slug,
      pending_changes,
      last_published_snapshot,
      purpose,
      property_type,
      availability_status,
      title,
      description,
      price,
      bedrooms,
      bathrooms,
      area_sqm,
      city,
      district,
      created_at
    `
    )
    .eq("id", id)
    .single();

  if (error || !p) return notFound();

  const hasSnapshot = !!p.last_published_snapshot;
  const hasPending = !!p.pending_changes && Object.keys(p.pending_changes).length > 0;

  // ✅ Current = last published snapshot (if exists)
  const current = hasSnapshot ? p.last_published_snapshot : {};

  // ✅ Proposed = pending changes if exists, else current row (new submissions)
  const proposedSource = hasPending ? p.pending_changes : p;

  const cur = (key) => (key in current ? current[key] : null);
  const prop = (key) => (key in proposedSource ? proposedSource[key] : null);

  return (
    <Container className="py-6">
      <PageHeader
        title="Review Listing"
        subtitle={`Status: ${p.status}`}
        right={
          <a className="text-sm underline" href="/dashboard/admin/properties?status=pending">
            ← Back
          </a>
        }
      />

      {!hasSnapshot ? (
        <div className="mb-4 rounded-xl border bg-background p-4 text-sm text-muted-foreground">
          This listing has never been published yet, so there is no “Last published” version to compare.
        </div>
      ) : null}

      <div className="rounded-xl border bg-background p-4">
        <div className="text-sm font-medium mb-3">
          Changes (Last Published → Requested)
        </div>

        <Row label="Title" left={cur("title")} right={prop("title")} />
        <Row label="Price" left={cur("price")} right={prop("price")} />
        <Row label="Purpose" left={cur("purpose")} right={prop("purpose")} />
        <Row label="Type" left={cur("property_type")} right={prop("property_type")} />
        <Row label="Availability" left={cur("availability_status")} right={prop("availability_status")} />
        <Row label="City" left={cur("city")} right={prop("city")} />
        <Row label="District" left={cur("district")} right={prop("district")} />
        <Row label="Bedrooms" left={cur("bedrooms")} right={prop("bedrooms")} />
        <Row label="Bathrooms" left={cur("bathrooms")} right={prop("bathrooms")} />
        <Row label="Area (sqm)" left={cur("area_sqm")} right={prop("area_sqm")} />
        <Row label="Description" left={cur("description")} right={prop("description")} />

        <div className="text-xs text-muted-foreground mt-3">
          Left column uses last_published_snapshot. Right column uses pending_changes (if present).
        </div>
      </div>
    </Container>
  );
}
