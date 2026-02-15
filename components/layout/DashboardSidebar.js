import Link from "next/link";
import { LayoutDashboard, Building2, Heart, MessageSquareText } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/listings", label: "My Listings", icon: Building2 },
  { href: "/dashboard/leads", label: "Leads", icon: MessageSquareText },
  { href: "/dashboard/favorites", label: "Favorites", icon: Heart },
];

export default function DashboardSidebar() {
  return (
    <aside className="hidden border-r bg-background md:block">
      <div className="p-4">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <span className="text-primary">MyProperty</span>
        </div>

        <nav className="grid gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4 text-primary" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
