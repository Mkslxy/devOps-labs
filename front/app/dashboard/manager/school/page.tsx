
"use client";

import React, { useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveList } from "@/components/ui/ResponsiveList";
import { Row } from "@/components/manager/groups/ui/Row";

import type { School } from "@/store/school/school.type";
import { useGetSchoolsQuery } from "@/store/school/school.api";
import { SchoolUpsertDialog } from "@/components/manager/school/dialog/add-edit-school/page";
import { DeleteSchoolDialog } from "@/components/manager/school/dialog/delete-school/page";
import ActionsDropdown from "@/components/ui/actions-dropdown";

export default function SchoolsPage() {
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data, isLoading } = useGetSchoolsQuery({ page });

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 md:gap-0 md:flex-row">
                <h1 className="text-2xl font-bold flex items-center gap-2">Школи</h1>

                <SchoolUpsertDialog
                    trigger={<Button>+ Додати школу</Button>}
                    onSuccess={() => {
                    }}
                />
            </div>

            <ResponsiveList
                data={data}
                isLoading={isLoading}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                getId={(s: any) => s.id}
                header={
                    <Card className="px-4 py-3 grid grid-cols-2 xl:grid-cols-6 text-sm text-muted-foreground">
                        <div>Назва</div>
                        <div className="hidden xl:block">Місто</div>
                        <div className="hidden xl:block">Адреса</div>
                        <div className="hidden xl:block">Широта</div>
                        <div className="hidden xl:block">Довгота</div>
                        <div className="text-right xl:text-center">Дії</div>
                    </Card>
                }
                renderRow={(s: School, open, onToggle) => (
                    <Card
                        onClick={onToggle}
                        className="px-4 py-3 grid grid-cols-2 xl:grid-cols-6 items-center cursor-pointer"
                    >
                        <div className="font-medium break-all">{s.name || "Немає"}</div>

                        <div className="hidden xl:flex w-[140px] break-all">{s.city || "Немає"}</div>

                        <div className="hidden xl:flex w-[260px] break-all">{s.address || "Немає"}</div>

                        <div className="hidden xl:flex w-[140px] break-all">
                            {s.latitude ? String(s.latitude) : "Немає"}
                        </div>

                        <div className="hidden xl:flex w-[140px] break-all">
                            {s.longitude ? String(s.longitude) : "Немає"}
                        </div>

                        <div
                            className="flex justify-end xl:justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ActionsDropdown
                                items={[
                                    {
                                        key: "edit",
                                        label: "",
                                        content: (
                                            <SchoolUpsertDialog
                                                school={s}
                                                trigger={
                                                    <div className="flex cursor-pointer items-center px-2 py-1.5 text-sm outline-none">
                                                        Редагувати
                                                    </div>
                                                }
                                            />
                                        ),
                                    },
                                    {
                                        key: "delete",
                                        label: "",
                                        content: (
                                            <DeleteSchoolDialog
                                                id={s.id}
                                                name={s.name}
                                                trigger={
                                                    <div className="flex cursor-pointer items-center px-2 py-1.5 text-sm text-destructive outline-none">
                                                        Видалити
                                                    </div>
                                                }
                                            />
                                        ),
                                    },
                                ]}
                            />
                        </div>
                    </Card>
                )}
                renderMobileDetails={(s: School) => (
                    <div className="space-y-3">
                        <Row label="Місто" value={s.city || "Немає"} />
                        <Row label="Адреса" value={s.address || "Немає"} />
                        <Row label="Широта" value={s.latitude ? String(s.latitude) : "Немає"} />
                        <Row label="Довгота" value={s.longitude ? String(s.longitude) : "Немає"} />
                    </div>
                )}
            />
        </div>
    );
}