"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  LayoutDashboard,
  Building2,
  Heart,
  LogOut,
  User,
  Inbox,
  Shield,
  CheckSquare,
} from "lucide-react";

export default function UserMenu() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [role, setRole] = useState("user"); // user | agent | admin

  useEffect(() => {
    let ignore = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (ignore) return;

      setUser(user || null);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();

        if (ignore) return;

        setProfileName(profile?.full_name || "");
        setRole(profile?.role || "user");
      } else {
        if (!ignore) {
          setProfileName("");
          setRole("user");
        }
      }
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      ignore = true;
      sub?.subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.refresh();
    if (pathname.startsWith("/dashboard")) router.push("/");
  }

  // Logged out UI
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
        >
          Login
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-[hsl(var(--hover))]"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const email = user.email || "";
  const name = profileName || email.split("@")[0] || "User";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const isAgentOrAdmin = role === "agent" || role === "admin";
  const isAdmin = role === "admin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <div className="flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-muted">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium leading-4">{name}</div>
            <div className="text-xs text-muted-foreground leading-4">{email}</div>
          </div>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/dashboard/favorites" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Favorites
          </Link>
        </DropdownMenuItem>

        {/* ✅ Agent/Admin section */}
        {isAgentOrAdmin ? (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/dashboard/listings" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                My Listings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/dashboard/leads" className="flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Leads
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}

        {/* ✅ Admin-only section */}
        {isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin
            </DropdownMenuLabel>

            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/admin/properties?status=pending"
                className="flex items-center gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                Moderate Properties
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={logout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
