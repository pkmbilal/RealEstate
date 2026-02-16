import { redirect } from "next/navigation";
import Container from "@/components/layout/Container";
import PageHeader from "@/components/layout/PageHeader";
import { supabaseServer } from "@/lib/supabase/server";
import EditProfileForm from "@/components/profile/EditProfileForm";

export default async function ProfilePage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role")
    .eq("id", user.id)
    .single();

  return (
    <Container className="py-6">
      <PageHeader title="My Profile" subtitle="Update your personal details." />

      {error ? (
        <pre className="text-red-600 mt-3">{JSON.stringify(error, null, 2)}</pre>
      ) : null}

      <div className="mt-4">
        <EditProfileForm
          initialFullName={profile?.full_name || ""}
          initialPhone={profile?.phone || ""}
          email={user.email || ""}
          role={profile?.role || "user"}
        />
      </div>
    </Container>
  );
}
