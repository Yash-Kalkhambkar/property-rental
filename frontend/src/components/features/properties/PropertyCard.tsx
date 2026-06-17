import { Link } from "@tanstack/react-router";
import { Building2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Property } from "@/types/api.types";

export function PropertyCard({ property }: { property: Property }) {
  const occupancy =
    property.total_units > 0
      ? Math.round((property.occupied_units / property.total_units) * 100)
      : 0;
  return (
    <Link to="/properties/$id" params={{ id: property.id }}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {property.property_type === "RESIDENTIAL" ? "Residential" : "Commercial"}
            </span>
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">{property.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {property.city}, {property.state}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center">
            <div>
              <p className="text-sm font-semibold text-foreground">{property.total_units}</p>
              <p className="text-xs text-muted-foreground">Units</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{occupancy}%</p>
              <p className="text-xs text-muted-foreground">Occupied</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(property.monthly_revenue)}
              </p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}