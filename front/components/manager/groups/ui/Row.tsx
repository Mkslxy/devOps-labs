export function Row({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right w-auto break-all">{value || "Немає"}</span>
        </div>
    );
}
