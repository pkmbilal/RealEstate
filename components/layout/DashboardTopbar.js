"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function DashboardTopbar() {
  const router = useRouter();

  async function logout() {
    const supabase = supabaseBrowser();

    await supabase.auth.signOut();

    // Refresh server components / layouts that depend on auth cookies
    router.refresh();

    // Go to home (or /auth/login if you prefer)
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-primary">Dashboard</span>
        </div>

        <Button variant="outline" onClick={logout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
