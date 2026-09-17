"use client";

import DatePicker from "react-datepicker";
import { forwardRef } from "react";
import { Input } from "@/components/ui/input";

type Props = {
    value?: string | null;
    onChange: (value: string | null) => void;
    placeholder?: string;
    minDate?: Date;
    maxDate?: Date;
};

export const DateTimePicker = forwardRef<HTMLInputElement, Props>(
    ({ value, onChange, placeholder, minDate, maxDate }, ref) => {
        const date = value ? new Date(value) : null;

        return (
            <DatePicker
                selected={date}
                onChange={(d: Date | null) =>
                    onChange(d ? d.toISOString().slice(0, 16) : null)
                }
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={5}
                dateFormat="yyyy-MM-dd HH:mm"
                minDate={minDate}
                maxDate={maxDate}
                placeholderText={placeholder}
                customInput={<Input ref={ref} />}
                popperClassName="dtp-popper ul"
            />
        );
    }
);
