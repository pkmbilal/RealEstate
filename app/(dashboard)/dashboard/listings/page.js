import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/common/EmptyState";
import { Plus } from "lucide-react";

export default async function ListingsPage() {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "agent" && profile?.role !== "admin") {
    redirect("/dashboard"); // simple gating for MVP
  }

  const { data: listings, error } = await supabase
    .from("properties")
    .select("id, title, price, currency, status, created_at")
    .eq("listed_by_user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Listings"
        subtitle="Create and manage your property listings."
        right={
          <Button asChild className="gap-2">
            <Link href="/dashboard/listings/new">
              <Plus className="h-4 w-4" />
              New Listing
            </Link>
          </Button>
        }
      />

      {error ? (
        <p className="text-sm text-red-600">Error: {error.message}</p>
      ) : null}

      {!listings?.length ? (
        <EmptyState
          title="No listings yet"
          description="Create your first listing to start receiving leads."
          actionLabel="Create listing"
          onAction={() => {}}
        />
      ) : (
        <div className="grid gap-3">
          {listings.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {p.currency} {p.price}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="border text-primary">
                    {p.status}
                  </Badge>
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/listings/${p.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
