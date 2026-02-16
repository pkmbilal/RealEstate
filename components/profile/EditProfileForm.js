"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, Shield } from "lucide-react";

export default function EditProfileForm({
  initialFullName = "",
  initialPhone = "",
  email = "",
  role = "user",
}) {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  function normalizePhone(v) {
    // keep it simple: allow + and digits/spaces
    return String(v || "").replace(/[^\d+ ]/g, "").trim();
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setMsg("You are not logged in.");
      return;
    }

    const payload = {
      full_name: fullName.trim(),
      phone: normalizePhone(phone),
    };

    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("✅ Profile updated!");
    router.refresh();
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 space-y-4">
        {/* Read-only info */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email
            </div>
            <div className="mt-1 font-medium">{email || "—"}</div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" /> Role
            </div>
            <div className="mt-1 font-medium capitalize">{role}</div>
          </div>
        </div>

        {/* Editable form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Full name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="mt-2 h-10 w-full rounded-lg border bg-background px-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Phone (for WhatsApp/calls)
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 05xxxxxxxx or +9665xxxxxxx"
              className="mt-2 h-10 w-full rounded-lg border bg-background px-3"
              inputMode="tel"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Tip: Save a valid number so agents can contact you.
            </p>
          </div>

          {msg ? (
            <div className="text-sm text-muted-foreground">{msg}</div>
          ) : null}

          <Button type="submit" className="gap-2" disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
