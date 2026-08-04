import { Resolution } from '../types/timetable';

export const DAYS_OF_WEEK = [
  { index: 0, short: 'Mon', full: 'Monday' },
  { index: 1, short: 'Tue', full: 'Tuesday' },
  { index: 2, short: 'Wed', full: 'Wednesday' },
  { index: 3, short: 'Thu', full: 'Thursday' },
  { index: 4, short: 'Fri', full: 'Friday' },
  { index: 5, short: 'Sat', full: 'Saturday' },
  { index: 6, short: 'Sun', full: 'Sunday' },
];

export function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export const formatMinutesToTimeString = minutesToTimeStr;

export function timeStrToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (remMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remMinutes}m`;
}

export function snapToResolution(minutes: number, resolution: Resolution): number {
  const rounded = Math.round(minutes / resolution) * resolution;
  return Math.max(resolution, rounded);
}

export function getISOWeekString(date: Date = new Date()): string {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNr = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.round((firstThursday - target.valueOf()) / 604800000);
  const year = target.getFullYear();
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

export function getWeekDateRangeLabel(weekId: string): string {
  const days = getWeekDaysWithDates(weekId);
  if (days.length === 0) return weekId;
  const start = days[0];
  const end = days[6];
  const parts = weekId.split('-W');
  const year = parts[0] || new Date().getFullYear();
  return `${start.monthShort} ${start.dateNum} – ${end.monthShort} ${end.dateNum}, ${year}`;
}

export function getWeekDaysWithDates(weekId: string) {
  const today = new Date();
  const todayYMD = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const parts = weekId.split('-W');
  let year = today.getFullYear();
  let week = 1;
  if (parts.length === 2) {
    year = parseInt(parts[0], 10);
    week = parseInt(parts[1], 10);
  }

  // ISO week 1 is the week with Jan 4th
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7; // Mon = 0, ..., Sun = 6
  const mondayOfWeek1 = new Date(year, 0, 4 - dayOfWeek);

  const targetMonday = new Date(mondayOfWeek1);
  targetMonday.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);

  return DAYS_OF_WEEK.map((d) => {
    const dayDate = new Date(targetMonday);
    dayDate.setDate(targetMonday.getDate() + d.index);

    const y = dayDate.getFullYear();
    const m = (dayDate.getMonth() + 1).toString().padStart(2, '0');
    const dateNum = dayDate.getDate();
    const dayYMD = `${y}-${m}-${dateNum.toString().padStart(2, '0')}`;

    const monthShort = dayDate.toLocaleDateString('en-US', { month: 'short' });

    return {
      index: d.index,
      short: d.short,
      full: d.full,
      dateNum,
      monthShort,
      dateFormatted: `${d.short}, ${monthShort} ${dateNum}`,
      isToday: dayYMD === todayYMD,
    };
  });
}

export function getAdjacentWeekId(weekId: string, offset: number): string {
  const parts = weekId.split('-W');
  if (parts.length !== 2) return weekId;
  const year = parseInt(parts[0], 10);
  const week = parseInt(parts[1], 10);

  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7;
  const mondayOfWeek1 = new Date(year, 0, 4 - dayOfWeek);

  const targetMonday = new Date(mondayOfWeek1);
  targetMonday.setDate(mondayOfWeek1.getDate() + (week - 1 + offset) * 7);

  return getISOWeekString(targetMonday);
}
