import Container from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search } from "lucide-react";

export default function HomePage() {
  return (
    <Container className="py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Find your next home in Saudi Arabia
        </h1>
        <p className="text-muted-foreground">
          Browse verified listings. Save favorites. Contact agents instantly.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Start exploring</p>
            <p className="font-semibold">Search properties for rent or sale</p>
          </div>

          <Button asChild className="gap-2">
            <Link href="/search">
              <Search className="h-4 w-4" />
              Browse Listings
            </Link>
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}
