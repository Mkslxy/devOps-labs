import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function dictToChartData(
    dict: Record<string, number> | undefined | null,
    valueKey: string = "value"
): Array<{ name: string; [k: string]: number | string }> {
  if (!dict) return [];
  return Object.entries(dict).map(([name, value]) => ({
    name,
    [valueKey]: Number(value ?? 0),
  }));
}

export function clampPercent(v: number | undefined | null): number {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
