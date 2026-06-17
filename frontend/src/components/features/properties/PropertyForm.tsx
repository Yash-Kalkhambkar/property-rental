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
import type { CreatePropertyPayload, Property, PropertyType } from "@/types/api.types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  address_line: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  property_type: z.enum(["RESIDENTIAL", "COMMERCIAL"]),
  total_units: z.coerce.number().int().min(1, "At least 1 unit"),
});

type FormValues = z.input<typeof schema>;

export function PropertyForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = "Save property",
}: {
  defaultValues?: Partial<Property>;
  onSubmit: (values: CreatePropertyPayload) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      address_line: defaultValues?.address_line ?? "",
      city: defaultValues?.city ?? "",
      state: defaultValues?.state ?? "",
      pincode: defaultValues?.pincode ?? "",
      property_type: (defaultValues?.property_type as PropertyType) ?? "RESIDENTIAL",
      total_units: defaultValues?.total_units ?? 1,
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit(schema.parse(v)))}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Property name</Label>
        <Input id="name" {...register("name")} placeholder="Sunrise Apartments" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_line">Address</Label>
        <Input id="address_line" {...register("address_line")} placeholder="123 MG Road" />
        {errors.address_line && (
          <p className="text-xs text-destructive">{errors.address_line.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register("city")} />
          {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" {...register("state")} />
          {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input id="pincode" {...register("pincode")} />
          {errors.pincode && (
            <p className="text-xs text-destructive">{errors.pincode.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="total_units">Total units</Label>
          <Input id="total_units" type="number" min={1} {...register("total_units")} />
          {errors.total_units && (
            <p className="text-xs text-destructive">{errors.total_units.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Property type</Label>
        <Select
          value={watch("property_type")}
          onValueChange={(v) => setValue("property_type", v as PropertyType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RESIDENTIAL">Residential</SelectItem>
            <SelectItem value="COMMERCIAL">Commercial</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}