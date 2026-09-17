"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    useGetStudentsQuery,
} from "@/store/users/user.api";
import CreateStudentForm from "@/components/manager/student/dialog/add-student/page";
import {DeleteStudentDialog} from "@/components/manager/student/dialog/delete-student/page";
import {Card} from "@/components/ui/card";
import {EditStudentDialog} from "@/components/manager/student/dialog/edit-student/page";
import { ResponsiveList } from "@/components/ui/ResponsiveList";
import {UserFormData} from "@/store/users/user.type";
import {School} from "@/store/school/school.type";
import ActionsDropdown from "@/components/ui/actions-dropdown";

export default function TeachersPage() {
    const [page, setPage] = useState(1);
    const [open, setOpen] = useState(false);
    const pageSize = 10;

    const { data, isLoading } = useGetStudentsQuery({
        page,
        page_size: pageSize,
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-3 md:gap-0 justify-between">
                <h1 className="text-2xl font-bold">Студенти</h1>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="cursor-pointer">+ Додати студента</Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Новий студент</DialogTitle>
                        </DialogHeader>

                        <CreateStudentForm onSuccess={() => setOpen(false)} />
                    </DialogContent>
                </Dialog>

            </div>

                    <ResponsiveList
                        data={data}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        isLoading={isLoading}
                        getId={(t: any) => t.id}
                        header={
                            <Card className="px-4 py-3 grid grid-cols-2 xl:grid-cols-7 text-sm font-medium text-muted-foreground">
                                <div>ПІБ</div>
                                <div className="hidden xl:block">Пошта</div>
                                <div className="hidden xl:block">Телефон</div>
                                <div className="hidden xl:block">Дата народження</div>
                                <div className="hidden xl:block">Школа</div>
                                <div className="hidden xl:block">Місто</div>
                                <div className="text-right xl:text-center">Дії</div>
                            </Card>
                        }
                        renderRow={(t: UserFormData, _open, onToggle) => {
                            const studentId = t.id;

                            return (
                                <Card
                                    onClick={onToggle}
                                    className="px-4 py-3 grid grid-cols-2 xl:grid-cols-7 items-center cursor-pointer md:cursor-default"
                                >
                                    <div className="font-medium w-[130px] break-all">
                                        {t.full_name || "Немає"}
                                    </div>

                                    <div className="hidden w-[120px] break-all xl:block text-sm text-muted-foreground truncate">
                                        {t.email || "Немає"}
                                    </div>

                                    <div className="hidden w-[150px] break-all xl:block text-sm">
                                        {t.phone_country_code || t.phone_national_number
                                            ? `${t.phone_country_code}${t.phone_national_number}`
                                            : "Немає"}
                                    </div>

                                    <div className="hidden w-[150px] break-all xl:block text-sm">
                                        {t.date_of_birth || "Немає"}
                                    </div>

                                    <div className="hidden w-[120px] break-all xl:block text-sm">
                                        {t.schools?.length
                                            ? t.schools.map((s) => s.name).join(", ")
                                            : "Немає"}
                                    </div>

                                    <div className="hidden w-[90px] break-all xl:block text-sm">
                                        {t.city || "Немає"}
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
                                                        <EditStudentDialog
                                                            student={t}
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
                                                    hidden: !studentId,
                                                    content: studentId ? (
                                                        <DeleteStudentDialog
                                                            id={studentId}
                                                            full_name={t.full_name}
                                                            trigger={
                                                                <div className="flex cursor-pointer items-center px-2 py-1.5 text-sm text-destructive outline-none">
                                                                    Видалити
                                                                </div>
                                                            }
                                                        />
                                                    ) : null,
                                                },
                                            ]}
                                        />
                                    </div>
                                </Card>
                            );
                        }}
                        renderMobileDetails={(t: any) => (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div className="text-muted-foreground">Пошта</div>
                                <div className="font-medium text-right break-all">
                                    {t.email || "Немає"}
                                </div>

                                <div className="text-muted-foreground">Телефон</div>
                                <div className="font-medium text-right">
                                    {`${t.phone_country_code}${t.phone_national_number}` || "Немає"}
                                </div>

                                <div className="text-muted-foreground">Дата народження</div>
                                <div className="font-medium text-right">
                                    {t.date_of_birth || "Немає"}
                                </div>

                                <div className="text-muted-foreground">Школа</div>
                                <div className="font-medium text-right">
                                    {t.schools?.length
                                        ? t.schools.map((s: School) => s.name ?? "Немає").join(", ")
                                        : "Немає"}
                                </div>


                                <div className="text-muted-foreground">Місто</div>
                                <div className="font-medium text-right">
                                    {t.city || "Немає"}
                                </div>
                            </div>
                        )}
                    />

        </div>
    );
}
