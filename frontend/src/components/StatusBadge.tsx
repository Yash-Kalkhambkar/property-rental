import { cn } from "@/lib/utils";
import type {
  LeaseStatus,
  PaymentStatus,
  UnitStatus,
} from "@/types/api.types";

type AnyStatus = LeaseStatus | PaymentStatus | UnitStatus;

const STYLES: Record<string, string> = {
  ACTIVE: "bg-success/15 text-success border-success/30",
  PAID: "bg-success/15 text-success border-success/30",
  OCCUPIED: "bg-success/15 text-success border-success/30",
  VACANT: "bg-primary/10 text-primary border-primary/30",
  PENDING: "bg-warning/15 text-warning-foreground border-warning/40",
  PARTIAL: "bg-warning/15 text-warning-foreground border-warning/40",
  MAINTENANCE: "bg-warning/15 text-warning-foreground border-warning/40",
  EXPIRED: "bg-muted text-muted-foreground border-border",
  TERMINATED: "bg-muted text-muted-foreground border-border",
  OVERDUE: "bg-destructive/12 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLES[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ")}
    </span>
  );
}