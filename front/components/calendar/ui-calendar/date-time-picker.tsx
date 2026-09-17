import { format, set, isSameDay } from "date-fns";
import { uk } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type {
    ControllerRenderProps,
    FieldValues,
    Path,
    PathValue,
    UseFormReturn,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/libs/utils";
import { useCalendar } from "../contexts/calendar-context";

type DateTimePickersProps<T extends FieldValues, N extends Path<T>> = {
    form: UseFormReturn<T>;
    field: ControllerRenderProps<T, N>;
};

type EnsureDateField<T extends FieldValues, N extends Path<T>> =
    PathValue<T, N> extends Date | undefined ? unknown : never;

export function DateTimePickers<T extends FieldValues, N extends Path<T>>({
                                                                              form,
                                                                              field,
                                                                          }: DateTimePickersProps<T, N> & EnsureDateField<T, N>) {
    const { use24HourFormat } = useCalendar();

    const formatUkrainianDate = (date: Date) =>
        use24HourFormat
            ? format(date, "dd.MM.yyyy HH:mm", { locale: uk })
            : format(date, "dd.MM.yyyy hh:mm aa", { locale: uk });

    function handleDateSelect(date: Date | undefined) {
        if (!date) return;

        const current = form.getValues(field.name) as PathValue<T, N>;
        const currentDate = (current ?? new Date()) as Date;

        let newDate = set(date, {
            hours: currentDate.getHours(),
            minutes: currentDate.getMinutes(),
            seconds: 0,
            milliseconds: 0,
        });

        const now = new Date();
        if (isSameDay(newDate, now) && newDate.getTime() < now.getTime()) {
            newDate = set(newDate, {
                hours: now.getHours(),
                minutes: now.getMinutes(),
                seconds: 0,
                milliseconds: 0,
            });
        }

        form.setValue(field.name, newDate as PathValue<T, N>, {
            shouldDirty: true,
            shouldValidate: true,
        });
    }

    const now = new Date();

    const isTimeBlocked = (type: "hour" | "minute", value: number) => {
        const selected = (form.getValues(field.name) ?? new Date()) as Date;

        if (!isSameDay(selected, now)) return false;

        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const selectedHour = selected.getHours();

        if (type === "hour") return value < currentHour;

        if (selectedHour < currentHour) return true;
        if (selectedHour === currentHour) return value < currentMinute;

        return false;
    };

    const getMinuteOptions = (currentMinute: number) => {
        const base = Array.from({ length: 12 }, (_, i) => i * 5);
        const list = [...base, currentMinute];
        return Array.from(new Set(list)).sort((a, b) => a - b);
    };

    const minuteOptions = getMinuteOptions(
        (field.value as Date | undefined)?.getMinutes() ?? new Date().getMinutes()
    );

    function handleTimeChange(type: "hour" | "minute" | "ampm", value: string) {
        const currentDate = (form.getValues(field.name) ?? new Date()) as Date;
        const newDate = new Date(currentDate);

        if (type === "hour") newDate.setHours(parseInt(value, 10));
        else if (type === "minute") newDate.setMinutes(parseInt(value, 10));
        else {
            const hours = newDate.getHours();
            if (value === "AM" && hours >= 12) newDate.setHours(hours - 12);
            if (value === "PM" && hours < 12) newDate.setHours(hours + 12);
        }

        form.setValue(field.name, newDate as PathValue<T, N>, {
            shouldDirty: true,
            shouldValidate: true,
        });
    }

    const fieldName = String(field.name);

    return (
        <FormItem className="flex flex-col">
            <FormLabel>
                {fieldName === "startDate"
                    ? "Дата початку заняття*"
                    : fieldName === "endDate"
                        ? "Дата завершення заняття"
                        : fieldName === "recurringStartDate"
                }
            </FormLabel>

            <Popover modal>
                <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                        >
                            {field.value ? (
                                formatUkrainianDate(field.value as Date)
                            ) : (
                                <span>дд.мм.рррр гг:хв</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0">
                    <div className="sm:flex">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                        <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                            <ScrollArea className="w-64 sm:w-auto">
                                <div className="flex sm:flex-col p-2">
                                    {Array.from({length: use24HourFormat ? 24 : 12}, (_, i) => i).map((hour) => (
                                        <Button
                                            key={hour}
                                            size="icon"
                                            disabled={isTimeBlocked("hour", hour)}
                                            variant={
                                                field.value &&
                                                field.value.getHours() % (use24HourFormat ? 24 : 12) === hour % (use24HourFormat ? 24 : 12)
                                                    ? "default"
                                                    : "ghost"
                                            }
                                            className="sm:w-full shrink-0 aspect-square"
                                            onClick={() => handleTimeChange("hour", hour.toString())}
                                        >
                                            {hour.toString().padStart(2, "0")}
                                        </Button>
                                    ))}
                                </div>
                                <ScrollBar orientation="horizontal" className="sm:hidden"/>
                            </ScrollArea>
                            <ScrollArea className="w-64 sm:w-auto">
                                <div className="flex sm:flex-col p-2">
                                    {minuteOptions.map((minute) => (
                                        <Button
                                            key={minute}
                                            size="icon"
                                            disabled={isTimeBlocked("minute", minute)}
                                            variant={field.value && field.value.getMinutes() === minute ? "default" : "ghost"}
                                            className="sm:w-full shrink-0 aspect-square"
                                            onClick={() => handleTimeChange("minute", minute.toString())}
                                        >
                                            {minute.toString().padStart(2, "0")}
                                        </Button>
                                    ))}
                                </div>
                                <ScrollBar orientation="horizontal" className="sm:hidden"/>
                            </ScrollArea>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            <FormMessage/>
        </FormItem>
    );
}
