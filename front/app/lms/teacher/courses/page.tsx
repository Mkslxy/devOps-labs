"use client";

import { useState } from "react";
import Link from "next/link";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppErrorState } from "@/components/ui/app-state";
import { LmsPage } from "@/components/layout/lms-page";
import CreateCourseForm from "@/components/lms/courses/dialog/add-course/page";
import { DeleteCourseDialog } from "@/components/lms/courses/dialog/delete-course/page";
import { EditCourseDialog } from "@/components/lms/courses/dialog/edit-course/page";
import CreateModuleForm from "@/components/lms/module/dialog/add-module/page";
import { DeleteModuleDialog } from "@/components/lms/module/dialog/delete-module/page";
import { EditModuleDialog } from "@/components/lms/module/dialog/edit-module/page";
import { DeleteMaterialDialog } from "@/components/lms/material/dialog/delete-material/page";
import { useGetCoursesQuery } from "@/store/groups/group.api";
import { useGetMaterialsQuery } from "@/store/material/material.api";
import { MATERIAL_LABELS } from "@/store/material/material.labels";
import { useGetModulesQuery } from "@/store/module/module.api";

export default function CoursesAndMaterialsPage() {
  return (
    <LmsPage
      title="Курси · Матеріали · Модулі"
      description="Керуйте навчальною структурою, матеріалами та модулями для уроків."
    >
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:w-fit">
          <TabsTrigger value="courses">Курси</TabsTrigger>
          <TabsTrigger value="materials">Матеріали</TabsTrigger>
          <TabsTrigger value="modules">Модулі</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <CoursesTab />
        </TabsContent>
        <TabsContent value="materials">
          <MaterialsTab />
        </TabsContent>
        <TabsContent value="modules">
          <ModulesTab />
        </TabsContent>
      </Tabs>
    </LmsPage>
  );
}

function CoursesTab() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const pageSize = 10;
  const { data, isLoading, isError, refetch } = useGetCoursesQuery({ page, page_size: pageSize });

  if (isError) return <AppErrorState onAction={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Курси</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ Додати курс</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Новий курс</DialogTitle>
            </DialogHeader>
            <CreateCourseForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <ResponsiveList
        data={data}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        isLoading={isLoading}
        getId={(course) => course.id}
        emptyTitle="Немає курсів"
        emptyDescription="Створіть перший курс, щоб додати матеріали та модулі."
        header={
          <Card className="grid grid-cols-2 px-4 py-3 text-sm font-medium text-muted-foreground shadow-sm xl:grid-cols-5">
            <div>Назва</div>
            <div className="hidden xl:block">Рівень</div>
            <div className="hidden xl:block">Ціна</div>
            <div className="hidden xl:block">Статус</div>
            <div className="text-right xl:text-center">Дії</div>
          </Card>
        }
        renderRow={(course, _open, onToggle) => (
          <Card onClick={onToggle} className="grid cursor-pointer grid-cols-2 items-center gap-3 px-4 py-3 shadow-sm md:cursor-default xl:grid-cols-5">
            <div className="min-w-0 font-medium"><span className="block truncate">{course.title || "Немає"}</span></div>
            <div className="hidden text-sm text-muted-foreground xl:block">{course.level || "Немає"}</div>
            <div className="hidden text-sm xl:block">{course.price ? `${course.price} ₴` : "Немає"}</div>
            <div className="hidden text-sm xl:block">
              {course.is_active ? <span className="text-emerald-600">Активний</span> : <span className="text-muted-foreground">Неактивний</span>}
            </div>
            <div className="flex justify-end gap-2 xl:justify-center">
              <EditCourseDialog course={course} />
              <DeleteCourseDialog id={course.id} title={course.title} />
            </div>
          </Card>
        )}
        renderMobileDetails={(course) => (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="text-muted-foreground">Рівень</div>
            <div className="text-right font-medium">{course.level || "Немає"}</div>
            <div className="text-muted-foreground">Ціна</div>
            <div className="text-right font-medium">{course.price ? `${course.price} ₴` : "Немає"}</div>
            <div className="text-muted-foreground">Статус</div>
            <div className="text-right font-medium">{course.is_active ? "Активний" : "Неактивний"}</div>
          </div>
        )}
      />
    </div>
  );
}

function MaterialsTab() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data, isLoading, isError, refetch } = useGetMaterialsQuery({ page, page_size: pageSize });

  if (isError) return <AppErrorState onAction={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Матеріали</h2>
        <Button asChild><Link href="/lms/teacher/courses/add/">+ Додати матеріал</Link></Button>
      </div>

      <ResponsiveList
        data={data}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        isLoading={isLoading}
        getId={(material) => material.id}
        emptyTitle="Немає матеріалів"
        emptyDescription="Додайте матеріали, файли або посилання для студентів."
        header={
          <Card className="grid grid-cols-2 px-4 py-3 text-sm font-medium text-muted-foreground shadow-sm xl:grid-cols-5">
            <div>Назва</div>
            <div className="hidden xl:block">Доступ</div>
            <div className="hidden xl:block">Файли</div>
            <div className="hidden xl:block">Посилання</div>
            <div className="text-right xl:text-center">Дії</div>
          </Card>
        }
        renderRow={(material, _open, onToggle) => (
          <Card onClick={onToggle} className="grid cursor-pointer grid-cols-2 items-center gap-3 px-4 py-3 shadow-sm md:cursor-default xl:grid-cols-5">
            <div className="min-w-0 font-medium"><span className="block truncate">{material.title || "Немає"}</span></div>
            <div className="hidden text-sm text-muted-foreground xl:block">{material.access_level ? MATERIAL_LABELS[material.access_level] : "Немає"}</div>
            <div className="hidden text-sm xl:block">{material.files?.length ? `${material.files.length} файл(и)` : "Немає"}</div>
            <div className="hidden text-sm xl:block">{material.links?.length ? `${material.links.length} посилання` : "Немає"}</div>
            <div className="flex justify-end gap-2 xl:justify-center">
              <Button variant="outline" asChild><Link href={`/lms/teacher/courses/edit/${material.id}`}>Редагувати</Link></Button>
              <DeleteMaterialDialog id={material.id} title={material.title} />
            </div>
          </Card>
        )}
        renderMobileDetails={(material) => (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="text-muted-foreground">Доступ</div>
            <div className="text-right font-medium">{material.access_level ? MATERIAL_LABELS[material.access_level] : "Немає"}</div>
            <div className="text-muted-foreground">Файли</div>
            <div className="text-right font-medium">{material.files?.length || "Немає"}</div>
            <div className="text-muted-foreground">Посилання</div>
            <div className="text-right font-medium">{material.links?.length || "Немає"}</div>
          </div>
        )}
      />
    </div>
  );
}

function ModulesTab() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const pageSize = 10;
  const { data, isLoading, isError, refetch } = useGetModulesQuery({ page, page_size: pageSize });

  if (isError) return <AppErrorState onAction={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Модулі</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ Додати модуль</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Новий модуль</DialogTitle>
            </DialogHeader>
            <CreateModuleForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <ResponsiveList
        data={data}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        isLoading={isLoading}
        getId={(module) => module.id}
        emptyTitle="Немає модулів"
        emptyDescription="Створіть модулі, щоб структурувати матеріали курсу."
        header={
          <Card className="grid grid-cols-2 px-4 py-3 text-sm font-medium text-muted-foreground shadow-sm xl:grid-cols-4">
            <div>Назва</div>
            <div className="hidden xl:block">Курс</div>
            <div className="hidden xl:block">Опис</div>
            <div className="text-right xl:text-center">Дії</div>
          </Card>
        }
        renderRow={(module, _open, onToggle) => (
          <Card onClick={onToggle} className="grid cursor-pointer grid-cols-2 items-center gap-3 px-4 py-3 shadow-sm md:cursor-default xl:grid-cols-4">
            <div className="min-w-0 font-medium"><span className="block truncate">{module.title || "Немає"}</span></div>
            <div className="hidden text-sm text-muted-foreground xl:block">{module.course_data?.title || module.course || "Немає"}</div>
            <div className="hidden text-sm xl:block">Навчальний модуль</div>
            <div className="flex justify-end gap-2 xl:justify-center">
              <EditModuleDialog module={module} />
              <DeleteModuleDialog id={module.id} title={module.title} />
            </div>
          </Card>
        )}
        renderMobileDetails={(module) => (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="text-muted-foreground">Курс</div>
            <div className="text-right font-medium">{module.course_data?.title || module.course || "Немає"}</div>
            <div className="text-muted-foreground">Опис</div>
            <div className="text-right font-medium">Навчальний модуль</div>
          </div>
        )}
      />
    </div>
  );
}
