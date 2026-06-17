import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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
import { StatusBadge } from "@/components/StatusBadge";
import { UnitForm } from "@/components/features/properties/UnitForm";
import {
  useProperty,
  useCreateUnit,
  useDeleteUnit,
  useDeleteProperty,
} from "@/hooks/useProperties";
import { formatCurrency } from "@/utils/formatCurrency";

export const Route = createFileRoute("/_app/properties/$id")({
  component: PropertyDetailPage,
});

function PropertyDetailPage() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const { data, isLoading } = useProperty(id);
  const createUnit = useCreateUnit(id);
  const deleteUnit = useDeleteUnit(id);
  const deleteProperty = useDeleteProperty();
  const [open, setOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (!data)
    return <p className="text-sm text-muted-foreground">Property not found.</p>;

  return (
    <div className="space-y-6">
      <Link
        to="/properties"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to properties
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {data.address_line}, {data.city}, {data.state} {data.pincode}
          </p>
        </div>
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={() =>
            deleteProperty.mutate(id, {
              onSuccess: () => navigate({ to: "/properties" }),
            })
          }
        >
          <Trash2 className="mr-1.5 h-4 w-4" /> Delete
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total units</p>
            <p className="mt-1 text-xl font-semibold">{data.total_units}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Occupied</p>
            <p className="mt-1 text-xl font-semibold">{data.occupied_units}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Monthly revenue</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(data.monthly_revenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Units</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Add unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add unit</DialogTitle>
            </DialogHeader>
            <UnitForm
              isSubmitting={createUnit.isPending}
              onSubmit={(v) =>
                createUnit.mutate(v, { onSuccess: () => setOpen(false) })
              }
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.units?.length ? (
                data.units.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.unit_number}</TableCell>
                    <TableCell>{u.unit_type}</TableCell>
                    <TableCell>{formatCurrency(u.monthly_rent)}</TableCell>
                    <TableCell>{u.current_tenant?.full_name ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={u.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteUnit.mutate(u.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No units added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}