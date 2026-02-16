import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

import { LayoutDashboard, Building2, Inbox, Heart, User } from "lucide-react";

function NavItem({ href, icon: Icon, label }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
    >
      <Icon className="h-4 w-4 text-primary" />
      <span>{label}</span>
    </Link>
  );
}

export default async function DashboardSidebar() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "user";
  const isAgent = role === "agent" || role === "admin";

  return (
    <aside className="border-r bg-background p-4">
      <div className="mb-4">
        <div className="text-sm text-muted-foreground">Signed in</div>
        <div className="font-medium">
          {profile?.full_name || user.email}
        </div>
        <div className="text-xs text-muted-foreground">Role: {role}</div>
      </div>

      <nav className="grid gap-1">
        <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem href="/dashboard/profile" icon={User} label="Profile" />
        <NavItem href="/dashboard/favorites" icon={Heart} label="Favorites" />


        {/* ✅ Only show to agent/admin */}
        {isAgent ? (
          <>
            <NavItem href="/dashboard/listings" icon={Building2} label="My Listings" />
            <NavItem href="/dashboard/leads" icon={Inbox} label="Leads" />
          </>
        ) : null}
      </nav>
    </aside>
  );
}
