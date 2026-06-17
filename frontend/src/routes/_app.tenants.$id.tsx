import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
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
import { TenantForm } from "@/components/features/tenants/TenantForm";
import { useTenant, useUpdateTenant, useDeleteTenant } from "@/hooks/useTenants";

export const Route = createFileRoute("/_app/tenants/$id")({
  component: TenantDetailPage,
});

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function TenantDetailPage() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const { data, isLoading } = useTenant(id);
  const update = useUpdateTenant(id);
  const del = useDeleteTenant();
  const [open, setOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-80 rounded-xl" />;
  if (!data) return <p className="text-sm text-muted-foreground">Tenant not found.</p>;

  return (
    <div className="space-y-6">
      <Link
        to="/tenants"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to tenants
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{data.full_name}</h1>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit tenant</DialogTitle>
              </DialogHeader>
              <TenantForm
                defaultValues={data}
                isSubmitting={update.isPending}
                submitLabel="Update tenant"
                onSubmit={(v) => update.mutate(v, { onSuccess: () => setOpen(false) })}
              />
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => del.mutate(id, { onSuccess: () => navigate({ to: "/tenants" }) })}
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-5 p-6 sm:grid-cols-3">
          <Field label="Phone" value={data.phone} />
          <Field label="Email" value={data.email} />
          <Field label="ID type" value={data.id_type} />
          <Field label="ID number" value={data.id_number} />
          <Field label="Emergency contact" value={data.emergency_contact_name} />
          <Field label="Emergency phone" value={data.emergency_contact_phone} />
          <div className="col-span-full">
            <Field label="Notes" value={data.notes} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}