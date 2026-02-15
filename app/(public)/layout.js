import PublicNavbar from "@/components/layout/PublicNavbar";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main className="pt-6">{children}</main>
    </div>
  );
}
