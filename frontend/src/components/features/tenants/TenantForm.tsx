import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateTenantPayload, IdType, Tenant } from "@/types/api.types";

const ID_TYPES: IdType[] = ["AADHAAR", "PAN", "PASSPORT", "DRIVING_LICENSE"];

const schema = z.object({
  full_name: z.string().min(1, "Name is required"),
  phone: z.string().min(8, "Enter a valid phone"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  id_type: z.enum(["AADHAAR", "PAN", "PASSPORT", "DRIVING_LICENSE"]).optional(),
  id_number: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.input<typeof schema>;

export function TenantForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = "Save tenant",
}: {
  defaultValues?: Partial<Tenant>;
  onSubmit: (values: CreateTenantPayload) => void;
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
      full_name: defaultValues?.full_name ?? "",
      phone: defaultValues?.phone ?? "",
      email: defaultValues?.email ?? "",
      emergency_contact_name: defaultValues?.emergency_contact_name ?? "",
      emergency_contact_phone: defaultValues?.emergency_contact_phone ?? "",
      id_type: defaultValues?.id_type ?? undefined,
      id_number: defaultValues?.id_number ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const submit = (v: FormValues) => {
    const parsed = schema.parse(v);
    const payload: CreateTenantPayload = {
      full_name: parsed.full_name,
      phone: parsed.phone,
      email: parsed.email || undefined,
      emergency_contact_name: parsed.emergency_contact_name || undefined,
      emergency_contact_phone: parsed.emergency_contact_phone || undefined,
      id_type: parsed.id_type,
      id_number: parsed.id_number || undefined,
      notes: parsed.notes || undefined,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" {...register("full_name")} />
          {errors.full_name && (
            <p className="text-xs text-destructive">{errors.full_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_name">Emergency contact</Label>
          <Input id="emergency_contact_name" {...register("emergency_contact_name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_phone">Emergency phone</Label>
          <Input id="emergency_contact_phone" {...register("emergency_contact_phone")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>ID type</Label>
          <Select
            value={watch("id_type") ?? ""}
            onValueChange={(v) => setValue("id_type", v as IdType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {ID_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="id_number">ID number</Label>
          <Input id="id_number" {...register("id_number")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}