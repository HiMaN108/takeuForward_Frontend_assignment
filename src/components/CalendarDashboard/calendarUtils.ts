export const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

/** Gradient overlay per month for the calendar image */
export const MONTH_OVERLAYS: string[] = [
  "rgba(70,130,220,0.30)",  // Jan – icy blue
  "rgba(220,80,120,0.28)",  // Feb – valentine
  "rgba(80,190,120,0.28)",  // Mar – spring green
  "rgba(160,120,220,0.25)", // Apr – lilac
  "rgba(240,200,80,0.22)",  // May – golden
  "rgba(255,160,60,0.25)",  // Jun – warm amber
  "rgba(240,100,50,0.28)",  // Jul – sunset
  "rgba(50,140,220,0.30)",  // Aug – ocean
  "rgba(200,140,60,0.28)",  // Sep – harvest
  "rgba(190,90,40,0.30)",   // Oct – rustic
  "rgba(120,80,50,0.28)",   // Nov – brown
  "rgba(100,160,230,0.30)", // Dec – frost
];

/** Individual calendar cell with metadata */
export interface CalendarCell {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isPrevMonth: boolean;
  isNextMonth: boolean;
}

/**
 * Build a full 6-row × 7-column calendar grid (Monday-start).
 * Fills in previous/next month dates so there are no blank cells.
 */
export function getCalendarDays(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  // Convert Sunday=0 → Monday-start: Mon=0 … Sun=6
  let startPad = firstDay.getDay() - 1;
  if (startPad < 0) startPad = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];

  // Previous month trailing days
  for (let i = startPad - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push({
      date: new Date(year, month - 1, day),
      day,
      isCurrentMonth: false,
      isPrevMonth: true,
      isNextMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: new Date(year, month, d),
      day: d,
      isCurrentMonth: true,
      isPrevMonth: false,
      isNextMonth: false,
    });
  }

  // Next month leading days (fill to 42 for 6 rows)
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      date: new Date(year, month + 1, nextDay),
      day: nextDay,
      isCurrentMonth: false,
      isPrevMonth: false,
      isNextMonth: true,
    });
    nextDay++;
  }

  return cells;
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Random integer in range [min, max] */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
