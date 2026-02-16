"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LeadStatusSelect({ leadId, initialStatus }) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus || "new");
  const [saving, setSaving] = useState(false);

  async function onChange(e) {
    const next = e.target.value;
    setStatus(next);
    setSaving(true);

    const { error } = await supabase
      .from("leads")
      .update({ status: next })
      .eq("id", leadId);

    setSaving(false);

    if (error) {
      alert(error.message);
      setStatus(initialStatus || "new");
      return;
    }

    router.refresh(); // ✅ refresh server page
  }

  return (
    <select
      value={status}
      onChange={onChange}
      disabled={saving}
      className="h-9 rounded-lg border bg-background px-3 text-sm"
    >
      <option value="new">New</option>
      <option value="contacted">Contacted</option>
      <option value="closed">Closed</option>
      <option value="spam">Spam</option>
    </select>
  );
}
