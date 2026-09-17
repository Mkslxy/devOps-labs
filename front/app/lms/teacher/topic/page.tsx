"use client";

import {useState} from "react";
import {Card} from "@/components/ui/card";
import {ResponsiveList} from "@/components/ui/ResponsiveList";

import {useGetTopicsQuery} from "@/store/topic/topic.api";
import type {Topic} from "@/store/topic/topic.type";

import {CreateTopicDialog} from "@/components/lms/topic/dialog/add-topic/page";
import {EditTopicDialog} from "@/components/lms/topic/dialog/edit-topic/page";
import {DeleteTopicDialog} from "@/components/lms/topic/dialog/delete-topic/page";

export default function TopicsPage() {
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const {data, isLoading} = useGetTopicsQuery({
        page,
        page_size: pageSize,
        ordering: "-id",
    });

    return (
        <div className="space-y-6">
            <div className="flex md:items-center flex-col md:flex-row gap-2 md:gap-0 justify-between">
                <h1 className="text-2xl text-left font-medium md:font-bold">Теми</h1>
                <CreateTopicDialog/>
            </div>

            <ResponsiveList
                data={data}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                isLoading={isLoading}
                getId={(t: Topic) => t.id}
                header={
                    <Card
                        className="px-4 py-3 grid grid-cols-2 xl:grid-cols-5 text-sm font-medium text-muted-foreground">
                        <div>Назва</div>
                        <div className="hidden xl:block">Модуль</div>
                        <div className="hidden xl:block">Опис</div>
                        <div className="hidden xl:block">Створений</div>
                        <div className="text-right xl:text-center">Дії</div>
                    </Card>
                }
                renderRow={(t, _open, onToggle) => (
                    <Card
                        onClick={onToggle}
                        className="px-4 py-3 grid grid-cols-2 xl:grid-cols-5 items-center cursor-pointer md:cursor-default"
                    >
                        <div className="font-medium w-[160px] break-all">{t.title || "Немає"}</div>

                        <div className="hidden xl:block text-sm text-muted-foreground">
                            {t.module_data?.title || (t.module ? `ID: ${t.module}` : "Немає")}
                        </div>

                        <div className="hidden xl:block text-sm text-muted-foreground truncate">
                            {t.content_description || "Немає"}
                        </div>

                        <div className="hidden xl:block text-sm text-muted-foreground">
                            <div className="hidden xl:block text-sm text-muted-foreground">
                                {typeof t.created_by === "object" && t.created_by
                                    ? t.created_by.full_name || t.created_by.email
                                    : t.created_by ?? "Немає"}
                            </div>
                        </div>

                        <div className="flex justify-end xl:justify-center gap-2">
                            <EditTopicDialog topic={t}/>
                            <DeleteTopicDialog id={t.id} title={t.title ?? ""}/>
                        </div>
                    </Card>
                )}
                renderMobileDetails={(t) => (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="text-muted-foreground">Модуль</div>
                        <div className="font-medium text-right w-auto break-all">{t.module_data?.title || "Немає"}</div>

                        <div className="text-muted-foreground">Створений</div>
                        <div className="font-medium text-right">
                            {typeof t.created_by === "object" && t.created_by
                                ? t.created_by.full_name || t.created_by.email
                                : t.created_by ?? "Немає"}
                        </div>

                        <div className="text-muted-foreground">Опис</div>
                        <div className="font-medium text-right">{t.content_description || "Немає"}</div>
                    </div>
                )}
            />
        </div>
    );
}
