import { format, subMonths, startOfMonth } from "date-fns";
import { uk } from "date-fns/locale";

export function toNumberMoney(value?: string | null): number {
    if (!value) return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

export type MonthPoint<T extends Record<string, number>> = {
    key: string;
    label: string;
} & T;

export function lastNMonthsKeys(count: number, now = new Date()): { key: string; label: string; date: Date }[] {
    const res: { key: string; label: string; date: Date }[] = [];
    for (let i = count - 1; i >= 0; i--) {
        const d = startOfMonth(subMonths(now, i));
        res.push({
            key: format(d, "yyyy-MM"),
            label: format(d, "MMM", { locale: uk }),
            date: d,
        });
    }
    return res;
}

export function monthKeyFromISO(iso: string): string {
    const d = new Date(iso);
    return format(d, "yyyy-MM");
}

export function quarterKeyFromISO(iso: string): { year: number; quarter: 1 | 2 | 3 | 4 } {
    const d = new Date(iso);
    const month = d.getMonth(); // 0..11
    const quarter = (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
    return { year: d.getFullYear(), quarter };
}

export function formatQuarterLabel(q: { year: number; quarter: 1 | 2 | 3 | 4 }): string {
    return `Q${q.quarter} ${q.year}`;
}