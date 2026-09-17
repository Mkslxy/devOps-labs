"use client";

import React from "react";
import { cn } from "@/libs/utils";

import type { UserFormData } from "@/store/users/user.type";

function getInitials(fullName?: string | null) {
    const v = (fullName || "Немає").trim();
    const letters = v
        .split(/\s+/)
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    return letters || "Н";
}

export function StudentColumnTable({ students }: { students: UserFormData[] }) {
    return (
        <div className="border-r border-border">
            <table className="border-collapse">
                <thead>
                <tr className="bg-muted/50 h-12 sm:h-12">
                    <th
                        className={cn(
                            "min-w-[150px] sm:min-w-[260px] w-[150px] sm:w-[260px] border-b border-border bg-muted/50",
                            "px-3 py-0 text-left text-xs font-medium text-foreground",
                            "sm:text-sm"
                        )}
                    >
                        <div className="flex h-12 sm:h-12 items-center">Студент</div>
                    </th>
                </tr>
                </thead>

                <tbody>
                {students.map((student, index) => {
                    const rowClass = cn(
                        "transition-colors hover:bg-muted/30",
                        index % 2 === 0 ? "bg-card" : "bg-card/50"
                    );

                    const sid = student.id;

                    return (
                        <tr key={sid ?? index} className={cn(rowClass, "h-12 sm:h-14")}>
                            <td className="border-b border-border px-3 sm:px-4 h-full">
                                <div className="flex h-full items-center gap-2">
                                    <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground sm:flex">
                                        {getInitials(student.full_name)}
                                    </div>
                                    <span className="text-xs font-medium text-foreground sm:text-sm">
                      {student.full_name || "Немає"}
                    </span>
                                </div>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}
