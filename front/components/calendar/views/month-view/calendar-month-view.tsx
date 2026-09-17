import { motion } from "framer-motion";
import { useMemo } from "react";
import { useCalendar } from "../../contexts/calendar-context";
import { calculateMonthEventPositions, getCalendarCells } from "../../helpers";
import { staggerContainer, transition } from "../../animations";
import { DayCell } from "./day-cell";
import {IEvent} from "@/components/calendar/interfaces";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
  canEditCalendar: boolean;
}

const WEEK_DAYS = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export function CalendarMonthView({ singleDayEvents, multiDayEvents, canEditCalendar }: IProps) {
  const { selectedDate } = useCalendar();

  const allEvents = [...multiDayEvents, ...singleDayEvents];

  const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);

  const eventPositions = useMemo(
    () =>
      calculateMonthEventPositions(
        multiDayEvents,
        singleDayEvents,
        selectedDate
      ),
    [multiDayEvents, singleDayEvents, selectedDate]
  );

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer}>
      <div className="grid grid-cols-7">
        {WEEK_DAYS.map((day, index) => (
          <motion.div
            key={day}
            className="flex items-center justify-center py-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, ...transition }}
          >
            <span className="text-xs font-medium text-t-quaternary">{day}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-4 overflow-hidden h-[calc(100dvh-140px)] md:h-auto">
        {cells.map((cell, index) => (
          <DayCell
            key={index}
            cell={cell}
            events={allEvents}
            eventPositions={eventPositions}
            canEditCalendar={canEditCalendar}
          />
        ))}
      </div>
    </motion.div>
  );
}
