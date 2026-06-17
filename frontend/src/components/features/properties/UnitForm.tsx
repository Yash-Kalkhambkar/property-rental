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
  monthly_rent: z.coerce.number().min(0, "Required"),
  deposit_amount: z.coerce.number().min(0, "Required"),
});

type FormValues = z.input<typeof schema>;

export function UnitForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: CreateUnitPayload) => void;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { unit_type: "1BHK", monthly_rent: 0, deposit_amount: 0 },
  });

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(schema.parse(v)))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit_number">Unit number</Label>
          <Input id="unit_number" {...register("unit_number")} placeholder="A-101" />
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
          <Label htmlFor="floor">Floor</Label>
          <Input id="floor" type="number" {...register("floor")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area_sqft">Area (sqft)</Label>
          <Input id="area_sqft" type="number" {...register("area_sqft")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthly_rent">Monthly rent</Label>
          <Input id="monthly_rent" type="number" {...register("monthly_rent")} />
          {errors.monthly_rent && (
            <p className="text-xs text-destructive">{errors.monthly_rent.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="deposit_amount">Deposit</Label>
          <Input id="deposit_amount" type="number" {...register("deposit_amount")} />
          {errors.deposit_amount && (
            <p className="text-xs text-destructive">{errors.deposit_amount.message}</p>
          )}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Add unit
      </Button>
    </form>
  );
}