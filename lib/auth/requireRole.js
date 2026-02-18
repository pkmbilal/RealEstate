import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

async function getRoleOrRedirectToLogin() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role || "user";
}

export async function requireAgentOrAdmin() {
  const role = await getRoleOrRedirectToLogin();
  if (role !== "admin" && role !== "agent") redirect("/dashboard");
}

export async function requireAdmin() {
  const role = await getRoleOrRedirectToLogin();
  if (role !== "admin") redirect("/dashboard");
}

