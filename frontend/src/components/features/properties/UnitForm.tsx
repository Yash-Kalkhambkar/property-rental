import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateUnitPayload, UnitType } from "@/types/api.types";

const UNIT_TYPES: UnitType[] = ["1BHK", "2BHK", "3BHK", "STUDIO", "SHOP", "OFFICE"];

const schema = z.object({
  unit_number: z.string().min(1, "Unit number is required"),
  floor: z.coerce.number().int().optional(),
  area_sqft: z.coerce.number().optional(),
  unit_type: z.enum(["1BHK", "2BHK", "3BHK", "STUDIO", "SHOP", "OFFICE"]),
  monthly_rent: z.coerce.number().min(1, "Required"),
  deposit_amount: z.coerce.number().min(0, "Required"),
});

type FormValues = z.input<typeof schema>;

export function UnitForm({
  onSubmit,
  isSubmitting,
  submitLabel = "Add unit",
  showAddAnother = false,
}: {
  onSubmit: (values: CreateUnitPayload) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  // When true, form resets after submit so user can add another unit immediately
  showAddAnother?: boolean;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { unit_type: "1BHK", monthly_rent: 0, deposit_amount: 0 },
  });

  const handleFormSubmit = (v: FormValues) => {
    onSubmit(schema.parse(v));
    if (showAddAnother) {
      // keep unit_type and rent values, only reset unit_number for convenience
      reset({
        unit_number: "",
        floor: undefined,
        area_sqft: undefined,
        unit_type: v.unit_type,
        monthly_rent: v.monthly_rent,
        deposit_amount: v.deposit_amount,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit_number">Unit number</Label>
          <Input id="unit_number" {...register("unit_number")} placeholder="101, A-2, GF-Shop…" />
          {errors.unit_number && (
            <p className="text-xs text-destructive">{errors.unit_number.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Unit type</Label>
          <Select
            value={watch("unit_type")}
            onValueChange={(v) => setValue("unit_type", v as UnitType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="floor">Floor (optional)</Label>
          <Input id="floor" type="number" placeholder="0" {...register("floor")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area_sqft">Area sqft (optional)</Label>
          <Input id="area_sqft" type="number" placeholder="850" {...register("area_sqft")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthly_rent">Monthly rent (₹)</Label>
          <Input id="monthly_rent" type="number" min={1} {...register("monthly_rent")} />
          {errors.monthly_rent && (
            <p className="text-xs text-destructive">{errors.monthly_rent.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="deposit_amount">Deposit (₹)</Label>
          <Input id="deposit_amount" type="number" min={0} {...register("deposit_amount")} />
          {errors.deposit_amount && (
            <p className="text-xs text-destructive">{errors.deposit_amount.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Adding…" : submitLabel}
      </Button>
    </form>
  );
}
