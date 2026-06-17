import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { PropertyCard } from "@/components/features/properties/PropertyCard";
import { PropertyForm } from "@/components/features/properties/PropertyForm";
import { useProperties, useCreateProperty } from "@/hooks/useProperties";

export const Route = createFileRoute("/_app/properties")({
  head: () => ({ meta: [{ title: "Properties — RentEase" }] }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useProperties();
  const create = useCreateProperty();
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Manage your buildings and units"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1.5 h-4 w-4" /> Add property
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add property</DialogTitle>
              </DialogHeader>
              <PropertyForm
                isSubmitting={create.isPending}
                onSubmit={(v) =>
                  create.mutate(v, { onSuccess: () => setOpen(false) })
                }
              />
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Add your first property to start tracking units, tenants and payments."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add property
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}