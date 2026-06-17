import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { useLease, useTerminateLease } from "@/hooks/useLeases";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

export const Route = createFileRoute("/_app/leases/$id")({
  component: LeaseDetailPage,
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function LeaseDetailPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useLease(id);
  const terminate = useTerminateLease(id);
  const [open, setOpen] = useState(false);
  const { register, handleSubmit } = useForm<{ reason: string; termination_date: string }>();

  if (isLoading) return <Skeleton className="h-80 rounded-xl" />;
  if (!data) return <p className="text-sm text-muted-foreground">Lease not found.</p>;

  return (
    <div className="space-y-6">
      <Link
        to="/leases"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to leases
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{data.tenant.full_name}</h1>
          <StatusBadge status={data.status} />
        </div>
        {data.status === "ACTIVE" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <Ban className="mr-1.5 h-4 w-4" /> Terminate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Terminate lease</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((v) =>
                  terminate.mutate(v, { onSuccess: () => setOpen(false) }),
                )}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="termination_date">Termination date</Label>
                  <Input id="termination_date" type="date" required {...register("termination_date")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea id="reason" rows={3} required {...register("reason")} />
                </div>
                <Button type="submit" variant="destructive" className="w-full" disabled={terminate.isPending}>
                  Confirm termination
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-5 p-6 sm:grid-cols-3">
          <Field label="Unit" value={`${data.unit.unit_number} · ${data.unit.property_name}`} />
          <Field label="Monthly rent" value={formatCurrency(data.monthly_rent)} />
          <Field label="Deposit paid" value={formatCurrency(data.deposit_paid)} />
          <Field label="Start date" value={formatDate(data.start_date)} />
          <Field label="End date" value={formatDate(data.end_date)} />
          <Field label="Rent due day" value={`Day ${data.rent_due_day}`} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-3 gap-5 p-6">
          <Field label="Total due" value={formatCurrency(data.payments_summary.total_due)} />
          <Field label="Total paid" value={formatCurrency(data.payments_summary.total_paid)} />
          <Field label="Overdue" value={formatCurrency(data.payments_summary.overdue_amount)} />
        </CardContent>
      </Card>
    </div>
  );
}