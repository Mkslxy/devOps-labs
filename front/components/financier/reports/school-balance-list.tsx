import { useMemo } from "react";
import { MapPin } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetPnlSchoolBalanceQuery } from "@/store/pnl/pnl.api";
import { toNumberMoney } from "@/libs/pnl-analytics";

type Props = {
    currencyId: number;
    currencyCode: string;
    selectedSchoolId: number | null;
    onSelectSchool: (id: number) => void;
};

function formatMoneyFull(value: number, currencyCode: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 2,
    }).format(value);
}

export function SchoolBalanceList({ currencyId, currencyCode, selectedSchoolId, onSelectSchool }: Props) {
    const { data, isFetching } = useGetPnlSchoolBalanceQuery({
        currency: currencyId,
        ordering: "-balance",
    });

    const rows = useMemo(() => data?.results ?? [], [data]);

    const total = useMemo(() => rows.reduce((sum, r) => sum + toNumberMoney(r.balance), 0), [rows]);

    return (
        <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
                <CardTitle>Баланс шкіл</CardTitle>
                <CardDescription>Натисни на школу, щоб подивитися деталізацію ({currencyCode})</CardDescription>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 gap-2">
                    {isFetching ? <div className="text-sm text-muted-foreground">Завантаження…</div> : null}

                    {rows.map((sb) => {
                        const balance = toNumberMoney(sb.balance);
                        const share = total > 0 ? ((balance / total) * 100) : 0;
                        const isSelected = selectedSchoolId === sb.school.id;

                        return (
                            <button
                                key={sb.id}
                                type="button"
                                onClick={() => onSelectSchool(sb.school.id)}
                                className={[
                                    "w-full text-left rounded-2xl border border-border/60 bg-card",
                                    "transition-colors hover:bg-accent/50",
                                    "px-4 py-3",
                                    isSelected ? "bg-primary/5 border-primary/30" : "",
                                ].join(" ")}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-primary">{sb.school.name.charAt(0)}</span>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{sb.school.name}</p>
                                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <MapPin className="size-3.5" />
                                                <span className="truncate">{sb.school.city ?? "Немає"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-mono font-semibold">{formatMoneyFull(balance, currencyCode)}</div>
                                        <div className="mt-1">
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {share.toFixed(1)}%
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {!isFetching && rows.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Немає даних</div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}