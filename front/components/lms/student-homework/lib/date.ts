export function daysLeft(deadline?: string | null): number | null {
    if (!deadline) return null;
    const target = new Date(deadline);
    if (Number.isNaN(target.getTime())) return null;

    const now = new Date();
    // reset hours to compare calendar days accurately
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffMs = targetDay.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function fmtDate(dateStr?: string | null): string {
    if (!dateStr) return "Немає";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);

    return d.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}
