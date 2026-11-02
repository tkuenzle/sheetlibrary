// When a sheet was last edited, as the library shows it: "Today",
// "Yesterday", "28 Oct", or "3 Sep 2025" before this year. Fixed English,
// like the rest of the UI, not the browser's locale.

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface Day {
  year: number;
  // 1 to 12.
  month: number;
  day: number;
}

// The calendar day of `at` in the time zone, or the runtime's own if none.
function dayOf(at: number, timeZone: string | undefined): Day {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}

function daysBetween(from: Day, to: Day): number {
  const ms = (d: Day) => Date.UTC(d.year, d.month - 1, d.day);
  return Math.round((ms(to) - ms(from)) / (24 * 60 * 60 * 1000));
}

// The day and month, and the year if it isn't the year of `now`.
export function editDate(at: number, now: number, timeZone?: string): string {
  const day = dayOf(at, timeZone);
  const date = `${String(day.day)} ${months[day.month - 1] ?? ""}`;
  return day.year === dayOf(now, timeZone).year
    ? date
    : `${date} ${String(day.year)}`;
}

// "Today" or "Yesterday" for those days, otherwise the date. An edit that
// seems to come from later today, from a clock that runs ahead, is today.
export function lastEdit(at: number, now: number, timeZone?: string): string {
  const days = daysBetween(dayOf(at, timeZone), dayOf(now, timeZone));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return editDate(at, now, timeZone);
}
