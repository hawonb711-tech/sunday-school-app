import { SundayInfo } from '../models/types';

export function getSundays(year: number): SundayInfo[] {
  const sundays: SundayInfo[] = [];
  const d = new Date(year, 0, 1);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  let idx = 0;
  while (d.getFullYear() === year) {
    sundays.push({
      date: new Date(d),
      dateStr: formatDate(d),
      day: d.getDate(),
      month: d.getMonth(),
      weekIndex: idx,
    });
    d.setDate(d.getDate() + 7);
    idx++;
  }
  return sundays;
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getCurrentWeekIndex(sundays: SundayInfo[]): number {
  const now = new Date();
  let closest = 0;
  let minDiff = Infinity;
  sundays.forEach((s, i) => {
    const diff = Math.abs(s.date.getTime() - now.getTime());
    if (diff < minDiff) { minDiff = diff; closest = i; }
  });
  return closest;
}

export function groupSundaysByMonth(sundays: SundayInfo[]): Map<number, SundayInfo[]> {
  const map = new Map<number, SundayInfo[]>();
  sundays.forEach(s => {
    if (!map.has(s.month)) map.set(s.month, []);
    map.get(s.month)!.push(s);
  });
  return map;
}

export function getQuarters(sundays: SundayInfo[]): { label: string; sundays: SundayInfo[] }[] {
  return [
    { label: '1분기 (1-3월)', sundays: sundays.filter(s => s.month <= 2) },
    { label: '2분기 (4-6월)', sundays: sundays.filter(s => s.month >= 3 && s.month <= 5) },
    { label: '3분기 (7-9월)', sundays: sundays.filter(s => s.month >= 6 && s.month <= 8) },
    { label: '4분기 (10-12월)', sundays: sundays.filter(s => s.month >= 9) },
  ];
}
