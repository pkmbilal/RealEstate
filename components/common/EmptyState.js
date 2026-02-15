// components/common/EmptyState.jsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EmptyState({
  title = "Nothing here yet",
  description = "Create your first item to see it here.",
  actionLabel,
  actionHref,
  icon,
}) {
  return (
    <div className="rounded-xl border bg-background p-8 text-center">
      {icon ? <div className="mx-auto mb-4 flex justify-center">{icon}</div> : null}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      {actionLabel && actionHref ? (
        <div className="mt-6 flex justify-center">
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
