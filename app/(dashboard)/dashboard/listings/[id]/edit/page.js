import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAgentOrAdmin } from "@/lib/auth/requireRole";
import EditListing from "@/components/listings/EditListing";

export default async function EditListingPage({ params }) {
  await requireAgentOrAdmin();

  const p = await params;
  const id = p.id;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // ✅ get role (so admin can bypass owner check)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "user";
  const isAdmin = role === "admin";

  const { data: listing, error } = await supabase
    .from("properties")
    .select(
      `
      id,
      listed_by_user_id,
      slug,
      status,
      availability_status,
      pending_changes,
      rejection_reason,
      purpose,
      property_type,
      title,
      description,
      price,
      bedrooms,
      bathrooms,
      area_sqm,
      city,
      district,
      published_at,
      created_at,
      updated_at
    `
    )
    .eq("id", id)
    .single();

  if (error || !listing) redirect("/dashboard/listings");

  // ✅ only owner OR admin
  if (!isAdmin && listing.listed_by_user_id !== user.id) redirect("/dashboard/listings");

  return <EditListing listing={listing} />;
}
