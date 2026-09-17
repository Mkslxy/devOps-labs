"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ResponsiveList } from "@/components/ui/ResponsiveList";

import { Subject } from "@/store/subject/subject.type";
import { useGetSubjectsQuery } from "@/store/subject/subject.api";

import CreateSubjectForm from "@/components/lms/subject/dialog/add-subject/page";
import EditSubjectForm from "@/components/lms/subject/dialog/edit-subject/page";
import DeleteSubjectForm from "@/components/lms/subject/dialog/delete-subject/page";
import ActionsDropdown from "@/components/ui/actions-dropdown";

export default function SubjectsPage() {
    const [page, setPage] = useState(1);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    const pageSize = 10;

    const { data, isLoading } = useGetSubjectsQuery({
        page,
        page_size: pageSize,
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Предмети</h1>
                    <p className="text-sm text-muted-foreground">
                        Створення та керування предметами для курсів.
                    </p>
                </div>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="cursor-pointer">+ Додати предмет</Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Новий предмет</DialogTitle>
                        </DialogHeader>

                        <CreateSubjectForm onSuccess={() => setCreateOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <ResponsiveList
                data={data}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                isLoading={isLoading}
                getId={(subject) => subject.id}
                header={
                    <Card className="grid grid-cols-2 px-4 py-3 text-sm font-medium text-muted-foreground xl:grid-cols-2">
                        <div>Назва</div>
                        <div className="text-right xl:text-center">Дії</div>
                    </Card>
                }
                renderRow={(subject, _open, onToggle) => (
                    <Card
                        onClick={onToggle}
                        className="grid cursor-pointer grid-cols-2 items-center px-4 py-3 md:cursor-default xl:grid-cols-2"
                    >
                        <div className="w-[120px] break-words text-sm font-medium md:w-[220px]">
                            {subject.name || "Немає"}
                        </div>

                        <div
                            className="flex justify-end xl:justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ActionsDropdown
                                items={[
                                    {
                                        key: "edit",
                                        label: "Редагувати",
                                        onClick: () => {
                                            setSelectedSubject(subject);
                                            setEditOpen(true);
                                        },
                                    },
                                    {
                                        key: "delete",
                                        label: "Видалити",
                                        destructive: true,
                                        onClick: () => {
                                            setSelectedSubject(subject);
                                            setDeleteOpen(true);
                                        },
                                    },
                                ]}
                            />
                        </div>
                    </Card>
                )}
                renderMobileDetails={(subject) => (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="text-muted-foreground">Номер</div>
                        <div className="text-right font-medium">
                            {subject.id || "Немає"}
                        </div>
                    </div>
                )}
            />

            <Dialog
                open={editOpen}
                onOpenChange={(open) => {
                    setEditOpen(open);

                    if (!open) {
                        setSelectedSubject(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Редагувати предмет</DialogTitle>
                    </DialogHeader>

                    {selectedSubject && (
                        <EditSubjectForm
                            subject={selectedSubject}
                            onSuccess={() => {
                                setEditOpen(false);
                                setSelectedSubject(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteOpen}
                onOpenChange={(open) => {
                    setDeleteOpen(open);

                    if (!open) {
                        setSelectedSubject(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Видалити предмет</DialogTitle>
                    </DialogHeader>

                    {selectedSubject && (
                        <DeleteSubjectForm
                            subject={selectedSubject}
                            onSuccess={() => {
                                setDeleteOpen(false);
                                setSelectedSubject(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}