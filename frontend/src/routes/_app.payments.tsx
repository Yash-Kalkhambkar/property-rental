import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { PaymentForm } from "@/components/features/payments/PaymentForm";
import { usePayments, useCreatePayment } from "@/hooks/usePayments";
import { useLeases } from "@/hooks/useLeases";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import type { PaymentStatus } from "@/types/api.types";

export const Route = createFileRoute("/_app/payments")({
  head: () => ({ meta: [{ title: "Payments — RentEase" }] }),
  component: PaymentsPage,
});

const STATUS_FILTERS: (PaymentStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "PAID",
  "PARTIAL",
  "OVERDUE",
];

function PaymentsPage() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<PaymentStatus | "ALL">("ALL");
  const { data, isLoading } = usePayments(status === "ALL" ? undefined : { status });
  const { data: leases } = useLeases({ status: "ACTIVE" });
  const create = useCreatePayment();
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Track rent collection and dues"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1.5 h-4 w-4" /> Record payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record payment</DialogTitle>
              </DialogHeader>
              <PaymentForm
                leases={leases?.items ?? []}
                isSubmitting={create.isPending}
                onSubmit={(v) => create.mutate(v, { onSuccess: () => setOpen(false) })}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            variant={status === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus(s)}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments recorded"
          description="Record a payment against an active lease to start tracking."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due date</TableHead>
                  <TableHead>Amount due</TableHead>
                  <TableHead>Amount paid</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Paid on</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{formatDate(p.due_date)}</TableCell>
                    <TableCell>{formatCurrency(p.amount_due)}</TableCell>
                    <TableCell>{formatCurrency(p.amount_paid)}</TableCell>
                    <TableCell>{p.payment_method?.replace("_", " ") ?? "—"}</TableCell>
                    <TableCell>{formatDate(p.paid_date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}