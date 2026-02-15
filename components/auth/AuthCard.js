import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl tracking-tight text-primary">{title}</CardTitle>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </CardHeader>

      <CardContent className="space-y-4">
        {children}
        {footer ? (
          <>
            <div className="pt-2" />
            <div className="text-sm text-muted-foreground">{footer}</div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
