import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAgentOrAdmin } from "@/lib/auth/requireRole";

export default async function LeadsPage() {
  await requireAgentOrAdmin();
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // role gate (agent/admin only)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "agent" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Load leads related to this agent's properties
  const { data: leads, error } = await supabase
    .from("leads")
    .select(`
      id,
      message,
      status,
      created_at,
      property_id,
      buyer_user_id,
      properties:property_id ( title, slug ),
      buyers:buyer_user_id ( full_name, phone )
    `)
    .order("created_at", { ascending: false });

  return (
    <div style={{ padding: 6 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
        Leads
      </h1>

      {error ? (
        <pre style={{ color: "crimson" }}>{JSON.stringify(error, null, 2)}</pre>
      ) : null}

      {!leads?.length ? (
        <p>No leads yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {leads.map((l) => (
            <div
              key={l.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {l.properties?.title || "Property"}
              </div>

              {l.properties?.slug ? (
                <div style={{ marginTop: 6 }}>
                  <Link href={`/property/${l.properties.slug}`}>
                    View property
                  </Link>
                </div>
              ) : null}

              <div style={{ opacity: 0.75, marginTop: 6 }}>
                Status: {l.status} •{" "}
                {new Date(l.created_at).toLocaleString()}
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 600 }}>Message</div>
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {l.message || "—"}
                </div>
              </div>

              <div style={{ marginTop: 10, opacity: 0.8 }}>
                Buyer: {l.buyers?.full_name || "—"}{" "}
                {l.buyers?.phone ? `• ${l.buyers.phone}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
