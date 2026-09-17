"use client";

import * as React from "react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { X } from "lucide-react";

import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import type { IEvent } from "../../interfaces";
import { EventDetailsDialog } from "../../dialogs/event-details-dialog";

type Props = {
    date: Date;
    events: IEvent[];
    children: React.ReactNode;
    canEditCalendar: boolean;
};

function toDate(d: string | Date) {
    return d instanceof Date ? d : new Date(d);
}

export function EventListPopover({ date, events, children , canEditCalendar }: Props) {
    const [open, setOpen] = React.useState(false);

    const sorted = React.useMemo(() => {
        return [...events].sort(
            (a, b) => toDate(a.startDate).getTime() - toDate(b.startDate).getTime()
        );
    }, [events]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>

            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[320px] p-0 overflow-hidden rounded-2xl"
            >
                <div className="relative bg-primary px-4 py-3 text-primary-foreground">
                    <div className="text-[11px] font-semibold opacity-90 uppercase">
                        {format(date, "EEE", { locale: uk })}
                    </div>
                    <div className="text-3xl font-bold leading-none">
                        {format(date, "d")}
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpen(false)}
                        className="absolute right-2 top-2 h-8 w-8 rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/25"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <ScrollArea className="h-[260px]">
                    <div className="p-3 space-y-2">
                        {sorted.map((e) => {
                            const time = format(toDate(e.startDate), "p", { locale: uk });

                            return (
                                <EventDetailsDialog key={e.id} event={e} canEditCalendar={canEditCalendar}>
                                    <button
                                        type="button"
                                        className={cn(
                                            "w-full text-left rounded-lg px-2 py-2",
                                            "hover:bg-muted transition flex items-center gap-2"
                                        )}
                                    >
                                        <span
                                            className="h-2 w-2 rounded-full shrink-0"
                                            style={{ backgroundColor: e.color_hex ?? "#3b82f6" }}
                                        />
                                        <div className="min-w-0">
                                            <div className="text-xs font-semibold text-muted-foreground">
                                                {time ?? "Немає"}
                                            </div>
                                            <div className="text-sm font-medium truncate">
                                                {e.title ?? "Немає"}
                                            </div>
                                        </div>
                                    </button>
                                </EventDetailsDialog>
                            );
                        })}
                    </div>

                    <ScrollBar orientation="vertical" />
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
