import { format, parseISO, isValid } from "date-fns";

export function formatDate(value: string | null | undefined, pattern = "dd MMM yyyy"): string {
  if (!value) return "—";
  const date = parseISO(value);
  if (!isValid(date)) return "—";
  return format(date, pattern);
}

export function toApiDate(value: Date | string): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "yyyy-MM-dd");
}