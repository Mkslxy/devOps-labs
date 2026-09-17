"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useGetRolesQuery } from "@/store/users/user.api";
import { Role } from "@/store/users/user.type";

interface ReportTemplateRolesSelectProps {
    value: number[];
    onChange: (value: number[]) => void;
    disabled?: boolean;
}

export function ReportTemplateRolesSelect({
                                              value,
                                              onChange,
                                              disabled,
                                          }: ReportTemplateRolesSelectProps) {
    const { data, isLoading } = useGetRolesQuery();

    const roles: Role[] = data?.results || [];

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <Label>Ролі</Label>

                <span className="text-xs text-muted-foreground">
                    Обрано: {value.length ? value.length : "Немає"}
                </span>
            </div>

            <Card className="p-3">
                {isLoading && (
                    <p className="text-sm text-muted-foreground">
                        Завантаження ролей...
                    </p>
                )}

                {!isLoading && !roles.length && (
                    <p className="text-sm text-muted-foreground">
                        Немає ролей
                    </p>
                )}

                {!isLoading && Boolean(roles.length) && (
                    <div className="grid max-h-[180px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
                        {roles.map((role) => {
                            const checked = value.includes(role.id);

                            return (
                                <label
                                    key={role.id}
                                    className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition hover:bg-muted/50"
                                >
                                    <Checkbox
                                        checked={checked}
                                        disabled={disabled}
                                        onCheckedChange={(nextChecked) => {
                                            if (nextChecked === true) {
                                                onChange(
                                                    value.includes(role.id)
                                                        ? value
                                                        : [...value, role.id]
                                                );
                                                return;
                                            }

                                            onChange(
                                                value.filter(
                                                    (roleId) =>
                                                        roleId !== role.id
                                                )
                                            );
                                        }}
                                    />

                                    <div className="min-w-0">
                                        <p className="truncate font-medium">
                                            {role.name || "Немає"}
                                        </p>

                                        <p className="truncate text-xs text-muted-foreground">
                                            {role.slug || "Немає"}
                                        </p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}