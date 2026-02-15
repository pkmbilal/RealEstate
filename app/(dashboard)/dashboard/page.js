import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-primary">
        Dashboard
      </h1>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="text-sm text-muted-foreground">Signed in as</div>
          <div className="font-medium">{user.email}</div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Role:</span>
            <Badge variant="secondary" className="border text-primary">
              {profile?.role || "user"}
            </Badge>
          </div>

          {error ? (
            <p className="text-sm text-red-600">
              Profile error: {error.message}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
