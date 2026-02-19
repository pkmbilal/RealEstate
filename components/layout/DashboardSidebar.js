import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

import {
  LayoutDashboard,
  Building2,
  Inbox,
  Heart,
  User,
  Shield,
  CheckSquare,
  List,
  Users,
} from "lucide-react";

function NavItem({ href, icon: Icon, label, badge }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span>{label}</span>
      </div>

      {badge ? (
        <span className="min-w-[22px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export default async function DashboardSidebar() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "user";
  const isAgent = role === "agent";
  const isAdmin = role === "admin";

  // ✅ Optional: pending moderation count (admin only)
  let pendingCount = 0;
  if (isAdmin) {
    const { count } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    pendingCount = count || 0;
  }

  return (
    <aside className="border-r bg-background p-4">
      <div className="mb-4">
        <div className="text-sm text-muted-foreground">Signed in</div>
        <div className="font-medium">{profile?.full_name || user.email}</div>
        <div className="text-xs text-muted-foreground">Role: {role}</div>
      </div>

      <nav className="grid gap-1">
        <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem href="/dashboard/profile" icon={User} label="Profile" />

        {/* ✅ USER-only: Favorites (Admins don't need it) */}
        {!isAdmin ? (
          <NavItem href="/dashboard/favorites" icon={Heart} label="Favorites" />
        ) : null}

        {/* ✅ AGENT-only */}
        {isAgent ? (
          <>
            <div className="my-2 border-t" />
            <NavItem href="/dashboard/listings" icon={Building2} label="My Listings" />
            <NavItem href="/dashboard/leads" icon={Inbox} label="Leads" />
          </>
        ) : null}

        {/* ✅ ADMIN-only */}
        {isAdmin ? (
          <>
            <div className="my-2 border-t" />

            <div className="px-3 pt-1 pb-2 text-xs text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin
            </div>

            <NavItem href="/dashboard/admin/agents" icon={Users} label="Agents" />

            <NavItem href="/dashboard/admin/properties" icon={List} label="All Listings" />

            <NavItem
              href="/dashboard/admin/properties?status=pending"
              icon={CheckSquare}
              label="Moderate Properties"
              badge={pendingCount > 0 ? String(pendingCount) : null}
            />
          </>
        ) : null}
      </nav>
    </aside>
  );
}
