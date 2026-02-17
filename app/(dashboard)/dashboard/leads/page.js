import Link from "next/link";
import { redirect } from "next/navigation";
import Container from "@/components/layout/Container";
import PageHeader from "@/components/layout/PageHeader";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAgentOrAdmin } from "@/lib/auth/requireRole";

import { Badge } from "@/components/ui/badge";
import LeadStatusSelect from "@/components/leads/LeadStatusSelect";
import LeadActions from "@/components/leads/LeadActions";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function statusBadge(status) {
  if (status === "new") return "bg-primary text-primary-foreground";
  if (status === "contacted") return "bg-muted text-foreground";
  if (status === "closed") return "bg-emerald-600 text-white";
  if (status === "spam") return "bg-red-600 text-white";
  return "bg-muted text-foreground";
}

function statusPriority(status) {
  if (status === "new") return 0;
  if (status === "contacted") return 1;
  if (status === "closed") return 2;
  if (status === "spam") return 3;
  return 9;
}

export default async function LeadsPage({ searchParams }) {
  await requireAgentOrAdmin();

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const sp = await searchParams;
  const active = (sp?.status || "all").trim();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  let q = supabase
    .from("leads")
    .select(
      `
      id,
      message,
      status,
      created_at,
      property:properties (
        id, slug, title, price, currency, city, district, listed_by_user_id
      ),
      buyer:profiles!leads_buyer_user_id_fkey (
        id, full_name, phone
      )
    `
    )
    .order("created_at", { ascending: false });

  if (active !== "all") q = q.eq("status", active);

  const { data: leads, error } = await q;

  let list = (leads || []).slice();
  list.sort((a, b) => {
    const ap = statusPriority(a.status);
    const bp = statusPriority(b.status);
    if (ap !== bp) return ap - bp;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const activeCount = list.length;

  const propertyIds = [
    ...new Set(list.map((l) => l?.property?.id).filter(Boolean)),
  ];
  let thumbByPropertyId = {};

  if (propertyIds.length) {
    const { data: media } = await supabase
      .from("property_media")
      .select("property_id, path, sort_order, created_at")
      .in("property_id", propertyIds)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    const bucket = "property-media";
    for (const m of media || []) {
      if (!thumbByPropertyId[m.property_id]) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(m.path);
        thumbByPropertyId[m.property_id] = data.publicUrl;
      }
    }
  }

  const tabs = [
    { key: "all", label: "All" },
    { key: "new", label: "New" },
    { key: "contacted", label: "Contacted" },
    { key: "closed", label: "Closed" },
    { key: "spam", label: "Spam" },
  ];

  const tabHref = (key) =>
    key === "all" ? "/dashboard/leads" : `/dashboard/leads?status=${key}`;

  const tabCount = (key) => (key === active ? activeCount : "—");

  return (
    <Container className="py-6">
      <PageHeader
        title="Leads Inbox"
        subtitle={
          isAdmin ? "All leads across the platform." : "Leads for your listings."
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <Link
              key={t.key}
              href={tabHref(t.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted"
              )}
            >
              <span>{t.label}</span>
              <span className={cn("text-xs opacity-80", isActive ? "opacity-90" : "")}>
                {tabCount(t.key)}
              </span>
            </Link>
          );
        })}
      </div>

      {error ? (
        <pre className="text-red-600 mt-3">{JSON.stringify(error, null, 2)}</pre>
      ) : null}

      {!list.length ? (
        <div className="mt-4 rounded-xl border bg-background p-8 text-center">
          <div className="text-lg font-semibold">No leads here</div>
          <p className="text-sm text-muted-foreground mt-2">
            Try another tab (New/Contacted/Closed/Spam).
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          {list.map((l) => {
            const p = l.property;
            const buyer = l.buyer;
            const cover = p?.id ? thumbByPropertyId[p.id] : null;

            const buyerName = buyer?.full_name || "";
            const phone = buyer?.phone || "";

            const isNew = l.status === "new";

            return (
              <div
                key={l.id}
                className={cn(
                  "rounded-xl border bg-background overflow-hidden hover:bg-muted/30 transition",
                  isNew ? "ring-1 ring-primary/50 border-primary/40" : ""
                )}
              >
                <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                  {cover ? (
                    <img
                      src={cover}
                      alt="Cover"
                      className="w-full h-44 object-cover md:h-full md:min-h-[170px]"
                    />
                  ) : (
                    <div className="w-full h-44 bg-muted md:h-full md:min-h-[170px]" />
                  )}

                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {p?.title || "Property"}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {p?.currency} {p?.price} • {p?.city || "—"}{" "}
                          {p?.district ? `(${p.district})` : ""}
                        </div>

                        {isNew ? (
                          <div className="mt-2 inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">
                            NEW lead
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={statusBadge(l.status)}>{l.status}</Badge>
                        <LeadStatusSelect leadId={l.id} initialStatus={l.status} />
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Buyer: </span>
                        <span className="font-medium">{buyerName || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone: </span>
                        <span className="font-medium">{phone || "—"}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">Date: </span>
                        <span className="font-medium">
                          {l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                        </span>
                      </div>
                    </div>

                    {/* ✅ Client actions: auto-set contacted on click */}
                    <LeadActions
                      leadId={l.id}
                      currentStatus={l.status}
                      phone={phone}
                      buyerName={buyerName}
                      propertyTitle={p?.title || ""}
                      propertySlug={p?.slug || ""}
                    />

                    {p?.slug ? (
                      <div>
                        <Link
                          href={`/property/${p.slug}`}
                          className="inline-flex rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                        >
                          View property
                        </Link>
                      </div>
                    ) : null}

                    {l.message ? (
                      <div className="text-sm text-muted-foreground rounded-lg border bg-muted/40 p-3 whitespace-pre-wrap">
                        {l.message}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        No message.
                      </div>
                    )}
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
