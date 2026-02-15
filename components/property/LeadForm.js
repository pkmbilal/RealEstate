"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LeadForm({ propertyId }) {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submitLead(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ✅ Strong check: session must exist
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session?.user?.id) {
      setLoading(false);
      router.push("/auth/login");
      return;
    }

    // ✅ Insert and confirm something was created
    const { data, error: insertErr } = await supabase
      .from("leads")
      .insert({
        property_id: propertyId,
        buyer_user_id: session.user.id,
        message: message || null,
      })
      .select("id")
      .single();

    setLoading(false);

    if (insertErr || !data?.id) {
      setError(insertErr?.message || "Lead could not be created.");
      return;
    }

    setDone(true);
    setMessage("");
  }

  if (done) {
    return (
      <div style={{ marginTop: 16, padding: 12, border: "1px solid #e5e7eb", borderRadius: 10 }}>
        ✅ Sent! The agent will contact you soon.
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setDone(false)} style={{ padding: "8px 12px" }}>
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submitLead} style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Contact Agent</div>

      <textarea
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Hi, I'm interested in this property. Please contact me."
        style={{
          width: "100%",
          padding: 10,
          border: "1px solid #e5e7eb",
          borderRadius: 10,
        }}
      />

      {error ? <div style={{ color: "crimson", marginTop: 8 }}>{error}</div> : null}

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 10,
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          cursor: "pointer",
        }}
      >
        {loading ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
