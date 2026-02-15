import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardTopbar from "@/components/layout/DashboardTopbar";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        <DashboardSidebar />
        <div className="min-h-screen">
          <DashboardTopbar />
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
