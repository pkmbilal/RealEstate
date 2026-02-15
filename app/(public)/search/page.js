import Container from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";

export default function SearchPage() {
  return (
    <Container className="py-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-4">Search</h1>

      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <Card>
          <CardContent className="p-4">
            <p className="font-medium">Filters</p>
            <p className="text-sm text-muted-foreground mt-1">
              (UI coming next: purpose, city, price, beds…)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="font-medium">Results</p>
            <p className="text-sm text-muted-foreground mt-1">
              (We’ll load published properties here)
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
