"use client";

import React, {useState} from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetGroupsQuery } from "@/store/groups/group.api";
import { DeleteGroupDialog } from "@/components/manager/groups/dialog/delete-group/page";
import {AGE_GROUP_LABELS, KNOWLEDGE_LEVEL_LABELS, STATUS_LABELS} from "@/store/groups/group.labels";
import {Row} from "@/components/manager/groups/ui/Row";
import {ResponsiveList} from "@/components/ui/ResponsiveList";
import {Group} from "@/store/groups/group.type";
import {PreviewWithDetails} from "@/components/ui/PreviewWithDetails";
import ActionsDropdown from "@/components/ui/actions-dropdown";

export default function GroupsPage() {
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data, isLoading } = useGetGroupsQuery({
        page,
        page_size: pageSize,
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    Групи
                </h1>

                <Link href="/dashboard/manager/groups/add/">
                    <Button>+ Додати групу</Button>
                </Link>
            </div>

            <ResponsiveList
                data={data}
                isLoading={isLoading}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                getId={(g: any) => g.id}
                header={
                    <Card className="px-4 py-3 grid grid-cols-2 xl:grid-cols-8 text-sm text-muted-foreground">
                        <div>Назва</div>
                        <div className="hidden xl:block">Курс</div>
                        <div className="hidden xl:block">Статус</div>
                        <div className="hidden xl:block">Вікова</div>
                        <div className="hidden xl:block">Рівень</div>
                        <div className="hidden xl:block">Студенти</div>
                        <div className="hidden xl:block">Онлайн</div>
                        <div className="text-right xl:text-center">Дії</div>
                    </Card>
                }
                renderRow={(g: Group, open, onToggle) => (
                    <Card onClick={onToggle} className="px-4 py-3 grid grid-cols-2 xl:grid-cols-8 items-center cursor-pointer">
                        <div className="font-medium w-[120px] break-all">{g.name || "Немає"}</div>
        
                        <div className="hidden xl:flex w-[100px] 2xl:w-[140px] break-all">
                            <PreviewWithDetails
                                items={g.course ? [g.course] : []}
                                getLabel={(c) => c.title}
                                renderDetails={(c) => (
                                    <>
                                        <div className="font-medium">{c.title || "Немає"}</div>
                                        <div>Рівень: {c.level || "Немає"}</div>
                                        <div>Ціна: {c.price || "Немає"}</div>
                                        <div>Статус: {c.is_active ? "Активний" : "Неактивний"}</div>
                                    </>
                                )}
                                maxPreviewItems={1}
                                variant="desktop"
                            />
                        </div>

                        <div className="hidden xl:block w-[200px] break-all">
                            {g.status ? STATUS_LABELS[g.status] || "Немає" : "Немає"}
                        </div>

                        <div className="hidden xl:block w-[200px] break-all">
                            {AGE_GROUP_LABELS[g.age_group] || "Немає"}
                        </div>

                        <div className="hidden xl:block w-[130px] break-all">
                            {KNOWLEDGE_LEVEL_LABELS[g.knowledge_level] || "Немає"}
                        </div>

                        <div className="hidden xl:block w-[100px] 2xl:w-[140px] break-all">
                            <PreviewWithDetails
                                items={g.students}
                                getLabel={(s) => s.full_name}
                                renderDetails={(s) => s.full_name}
                                variant="desktop"
                            />
                        </div>

                        <div className="hidden xl:block">
                            {g.is_online ? "Так" : "Ні"}
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
                                            <Link href={`/dashboard/manager/groups/edit/${g.id}`}>
                                                <div className="flex cursor-pointer items-center px-2 py-1.5 text-sm outline-none">
                                                    Редагувати
                                                </div>
                                            </Link>
                                        ),
                                    },
                                    {
                                        key: "delete",
                                        label: "",
                                        content: (
                                            <DeleteGroupDialog
                                                id={g.id}
                                                name={g.name}
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
                renderMobileDetails={(g: Group) => (
                    <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <span className="text-muted-foreground shrink-0">Курс</span>
                            <div className="flex flex-col items-end min-w-0 text-right">
                                <PreviewWithDetails
                                    items={g.course ? [g.course] : []}
                                    getLabel={(c) => c.title}
                                    renderDetails={(c) => (
                                        <>
                                            <div>Рівень: {c.level || "Немає"}</div>
                                            <div>Ціна: {c.price || "Немає"}</div>
                                            <div>Статус: {c.is_active ? "Активний" : "Неактивний"}</div>
                                        </>
                                    )}
                                    maxPreviewItems={1}
                                    variant="mobile"
                                />
                            </div>
                        </div>
                        <Row label="Статус" value={g.status ? STATUS_LABELS[g.status] || "Немає" : "Немає"}/>
                        <Row label="Вікова" value={AGE_GROUP_LABELS[g.age_group] || "Немає"} />
                        <Row label="Рівень" value={KNOWLEDGE_LEVEL_LABELS[g.knowledge_level] || "Немає"}
                        />

                        <div className="flex items-start justify-between gap-4">
                            <span className="text-muted-foreground shrink-0">Студенти</span>

                            <div className="flex flex-col items-end min-w-0 text-right">
                                <PreviewWithDetails
                                    items={g.students}
                                    getLabel={(s) => s.full_name}
                                    renderDetails={(s) => s.full_name}
                                    variant="mobile"
                                />
                            </div>
                        </div>

                        <Row label="Онлайн" value={g.is_online ? "Так" : "Ні"} />
                    </div>
                )}
            />
        </div>
    );
}
