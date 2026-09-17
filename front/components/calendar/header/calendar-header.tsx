"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendar } from "../contexts/calendar-context";
import { slideFromLeft, slideFromRight, transition } from "../animations";
import { DateNavigator } from "../ui-calendar/date-navigator";
import { AddEditEventDialog } from "../dialogs/add-edit-event-dialog";
import Views from "../header/view-tabs";
import {useGetProfileMeQuery} from "@/store/users/user.api";

export function CalendarHeader() {
  const { view, events } = useCalendar();
  const { data: me } = useGetProfileMeQuery();

  const role = me?.role?.slug;

  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <motion.div
        className="flex items-center gap-3"
        variants={slideFromLeft}
        initial="initial"
        animate="animate"
        transition={transition}
      >
        <DateNavigator view={view} events={events} />
      </motion.div>

      <motion.div
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-1.5"
        variants={slideFromRight}
        initial="initial"
        animate="animate"
        transition={transition}
      >
        <div className="options flex-wrap flex items-center gap-4 md:gap-2">
          <Views />
        </div>

        {role !== "student" && (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-1.5">
                <AddEditEventDialog>
                    <Button className="cursor-pointer">
                        <Plus className="h-4 w-4" />
                        Додати подію
                    </Button>
                </AddEditEventDialog>
            </div>
        )}
      </motion.div>
    </div>
  );
}
