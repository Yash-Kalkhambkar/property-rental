import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Users, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { TenantForm } from "@/components/features/tenants/TenantForm";
import { useTenants, useCreateTenant } from "@/hooks/useTenants";

export const Route = createFileRoute("/_app/tenants")({
  head: () => ({ meta: [{ title: "Tenants — RentEase" }] }),
  component: TenantsPage,
});

function TenantsPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useTenants(search ? { search } : undefined);
  const create = useCreateTenant();
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Your tenant directory"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1.5 h-4 w-4" /> Add tenant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add tenant</DialogTitle>
              </DialogHeader>
              <TenantForm
                isSubmitting={create.isPending}
                onSubmit={(v) => create.mutate(v, { onSuccess: () => setOpen(false) })}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenants found"
          description="Add tenants to assign them to leases."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link to="/tenants/$id" params={{ id: t.id }} className="hover:underline">
                        {t.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{t.phone}</TableCell>
                    <TableCell>{t.email ?? "—"}</TableCell>
                    <TableCell>{t.id_type ?? "—"}</TableCell>
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