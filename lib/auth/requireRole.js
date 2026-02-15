import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function requireAgentOrAdmin() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "user";
  const ok = role === "agent" || role === "admin";
  if (!ok) redirect("/dashboard");

  return { user, role };
}
