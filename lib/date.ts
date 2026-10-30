import { TZDate } from "@date-fns/tz";

export function parseLocalDateTime(value: string, timezone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) throw new Error("Enter a valid date and time.");
  const [, year, month, day, hour, minute, second] = match;
  const parsed = new TZDate(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second ?? 0), timezone);
  if (Number.isNaN(parsed.getTime())) throw new Error("Enter a valid date and time.");
  if (toDateTimeLocalValue(parsed, timezone) !== value.slice(0, 16)) throw new Error("This local time does not exist in the selected timezone. Choose a valid date and time.");
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
