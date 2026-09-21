import { TZDate } from "@date-fns/tz";

export function parseLocalDateTime(value: string, timezone: string): Date {
  const parsed = new TZDate(value, timezone);
  if (Number.isNaN(parsed.getTime())) throw new Error("Enter a valid date and time.");
  return new Date(parsed.getTime());
}

export function toDateTimeLocalValue(value: Date | string, timezone: string): string {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce<Record<string, string>>((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
