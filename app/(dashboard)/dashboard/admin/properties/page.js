import Container from "@/components/layout/Container";
import PageHeader from "@/components/layout/PageHeader";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireRole";
import AdminPropertyActions from "@/components/admin/AdminPropertyActions";

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

export default async function AdminPropertiesPage({ searchParams }) {
  await requireAdmin();

  const sp = await searchParams;
  const status = sp?.status ?? "pending";

  const supabase = await supabaseServer();

  const { data: properties, error } = await supabase
    .from("properties")
    .select(
      "id,title,slug,price,city,property_type,purpose,status,created_at,listed_by_user_id,rejection_reason"
    )
    .eq("status", status)
    .order("created_at", { ascending: false });

  return (
    <Container>
      <PageHeader title="Moderate Properties" subtitle="Approve or reject listings" />

      <div className="flex gap-2 mb-4">
        <Tab href="/dashboard/admin/properties?status=pending" active={status === "pending"}>
          Pending
        </Tab>
        <Tab href="/dashboard/admin/properties?status=published" active={status === "published"}>
          Published
        </Tab>
        <Tab href="/dashboard/admin/properties?status=rejected" active={status === "rejected"}>
          Rejected
        </Tab>
      </div>

      {error ? <div className="text-sm text-destructive mb-3">{error.message}</div> : null}

      <div className="space-y-3">
        {properties?.length ? (
          properties.map((p) => (
            <div
              key={p.id}
              className="border rounded-xl p-4 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{p.title}</div>

                <div className="text-sm text-muted-foreground">
                  {p.city || "—"} • {p.property_type || "—"} • {p.purpose || "—"} •{" "}
                  {Number(p.price || 0).toLocaleString()}
                </div>

                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(p.created_at).toLocaleString()}
                </div>

                {p.status === "rejected" && p.rejection_reason ? (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Reason:</span> {p.rejection_reason}
                  </div>
                ) : null}
              </div>

              <AdminPropertyActions
                propertyId={p.id}
                status={p.status}
                slug={p.slug}
                previewHref={`/dashboard/admin/properties/${p.id}`} // ✅ new
              />
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No properties.</div>
        )}
      </div>
    </Container>
  );
}
