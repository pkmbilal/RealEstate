import Link from "next/link";
import Container from "./Container";
import { Button } from "@/components/ui/button";
import { Home, LogIn, Search, UserPlus } from "lucide-react";

export default function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Home className="h-5 w-5 text-primary" />
          <span>MyProperty</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex gap-2">
            <Link href="/search">
              <Search className="h-4 w-4" />
              Browse
            </Link>
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link href="/auth/login">
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </Button>

          <Button asChild className="hidden sm:inline-flex gap-2">
            <Link href="/auth/signup">
              <UserPlus className="h-4 w-4" />
              Sign up
            </Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
