
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export type ScheduleItem = {
    day_of_week: number;
    time: string;
    lesson_type_id?: number;
    is_online?: boolean;
};

const DAYS: { id: number; label: string }[] = [
    { id: 0, label: "Нд" },
    { id: 1, label: "Пн" },
    { id: 2, label: "Вт" },
    { id: 3, label: "Ср" },
    { id: 4, label: "Чт" },
    { id: 5, label: "Пт" },
    { id: 6, label: "Сб" },
];

type Props = {
    value: ScheduleItem[];
    onChange: (next: ScheduleItem[]) => void;
};

export function SchedulePicker({ value, onChange }: Props) {
    const getItem = (day: number) => value.find((x) => x.day_of_week === day) ?? null;

    const toggleDay = (day: number, checked: boolean) => {
        if (!checked) {
            onChange(value.filter((x) => x.day_of_week !== day));
            return;
        }
        onChange([
            ...value,
            { day_of_week: day, time: "10:00", is_online: true },
        ]);
    };

    const changeTime = (day: number, time: string) => {
        onChange(
            value.map((x) => (x.day_of_week === day ? { ...x, time } : x))
        );
    };

    return (
        <div className="space-y-2 rounded-xl border p-3">
            {DAYS.map((d) => {
                const item = getItem(d.id);
                const checked = !!item;

                return (
                    <div key={d.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => toggleDay(d.id, Boolean(v))}
                            />
                            <span className="text-sm">{d.label}</span>
                        </div>

                        <Input
                            type="time"
                            className="w-[120px]"
                            value={item?.time ?? "10:00"}
                            disabled={!checked}
                            onChange={(e) => changeTime(d.id, e.target.value)}
                        />
                    </div>
                );
            })}
        </div>
    );
}
