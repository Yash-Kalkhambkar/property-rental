import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { PropertyCard } from "@/components/features/properties/PropertyCard";
import { PropertyForm } from "@/components/features/properties/PropertyForm";
import { UnitForm } from "@/components/features/properties/UnitForm";
import { useProperties, useCreateProperty, useCreateUnit } from "@/hooks/useProperties";
import type { Property } from "@/types/api.types";

export const Route = createFileRoute("/_app/properties")({
  head: () => ({ meta: [{ title: "Properties — RentEase" }] }),
  component: PropertiesPage,
});

// ── 2-step add property wizard ────────────────────────────────
function AddPropertyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [step, setStep] = useState<"property" | "units">("property");
  const [createdProperty, setCreatedProperty] = useState<Property | null>(null);
  const [unitsAdded, setUnitsAdded] = useState(0);

  const createProperty = useCreateProperty();
  const createUnit = useCreateUnit(createdProperty?.id ?? "");

  const handleClose = (v: boolean) => {
    if (!v) {
      // reset state when dialog closes
      setTimeout(() => {
        setStep("property");
        setCreatedProperty(null);
        setUnitsAdded(0);
      }, 200);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span className={step === "property" ? "font-semibold text-foreground" : ""}>
            1. Property details
          </span>
          <span>→</span>
          <span className={step === "units" ? "font-semibold text-foreground" : ""}>
            2. Add units
          </span>
        </div>

        {step === "property" && (
          <>
            <DialogHeader>
              <DialogTitle>Add property</DialogTitle>
            </DialogHeader>
            <PropertyForm
              isSubmitting={createProperty.isPending}
              submitLabel="Save & add units →"
              onSubmit={(v) =>
                createProperty.mutate(v, {
                  onSuccess: (res) => {
                    setCreatedProperty(res.data);
                    setStep("units");
                  },
                })
              }
            />
          </>
        )}

        {step === "units" && createdProperty && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                {createdProperty.name} created
              </DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground -mt-2">
              Add units to this property. You can always add more later from the property page.
            </p>

            {unitsAdded > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span>
                  <span className="font-medium">{unitsAdded}</span> unit{unitsAdded > 1 ? "s" : ""} added
                </span>
                <Badge variant="secondary" className="ml-auto">
                  {createdProperty.name}
                </Badge>
              </div>
            )}

            <UnitForm
              isSubmitting={createUnit.isPending}
              submitLabel="Add unit"
              showAddAnother
              onSubmit={(v) =>
                createUnit.mutate(v, {
                  onSuccess: () => setUnitsAdded((n) => n + 1),
                })
              }
            />

            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleClose(false)}
            >
              {unitsAdded > 0 ? "Done" : "Skip — add units later"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
function PropertiesPage() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useProperties();
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Manage your buildings and units"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add property
          </Button>
        }
      />

      <AddPropertyDialog open={open} onOpenChange={setOpen} />

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
