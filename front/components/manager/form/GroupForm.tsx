"use client";

import { useEffect, useMemo, useState } from "react";

import CoursePicker from "@/components/lms/courses/card/CoursePicker";
import StudentPicker from "@/components/manager/student/card/StudentPicker";
import SchoolPickerDefault from "@/components/manager/groups/card/SchoolPickerDefault";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/ui/required-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatApiError, validateRequiredFields, type FieldErrors } from "@/libs/form-validation";
import {
  AGE_GROUP_LABELS,
  KNOWLEDGE_LEVEL_LABELS,
  STATUS_LABELS,
} from "@/store/groups/group.labels";
import {
  AgeGroupEnum,
  KnowledgeLevelEnum,
  StatusEnum,
  type Group,
  type GroupPayload,
} from "@/store/groups/group.type";
import { useCreateGroupMutation, useUpdateGroupMutation } from "@/store/groups/group.api";
import { useGetTeachersQuery } from "@/store/users/user.api";

type GroupFormErrors = FieldErrors<"name" | "teacher_id" | "school" | "api">;

type FormState = {
  name: string;
  status: StatusEnum;
  age_group: AgeGroupEnum;
  knowledge_level: KnowledgeLevelEnum;
  teacher_id: number | null;
  course_id: number | null;
  school: number | null;
  student_ids: number[];
  is_online: boolean;
};

interface Props {
  initialData?: Partial<Group>;
  groupId?: number;
  onSubmitSuccess?: () => void;
}

const getEntityId = (value: unknown) => {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "number" ? id : null;
  }
  return null;
};

export default function GroupForm({ initialData, groupId, onSubmitSuccess }: Props) {
  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation();

  const { data: teachers, isLoading: teachersLoading } = useGetTeachersQuery({
    page_size: 50,
  });

  const teacherOptions = useMemo(() => teachers?.results ?? [], [teachers]);

  const defaultForm: FormState = useMemo(
    () => ({
      name: "",
      status: StatusEnum.recruiting,
      age_group: AgeGroupEnum.kids,
      knowledge_level: KnowledgeLevelEnum.beginner,
      teacher_id: null,
      course_id: null,
      school: null,
      student_ids: [],
      is_online: false,
    }),
    []
  );

  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<GroupFormErrors>({});

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined, api: undefined }));
  };

  const validate = () => {
    const nextErrors: GroupFormErrors = validateRequiredFields([
      { key: "name", label: "Назва групи", value: form.name },
      { key: "teacher_id", label: "Викладач", value: form.teacher_id },
      { key: "school", label: "Школа", value: form.school },
    ]);

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;

    const payload: GroupPayload = {
      name: form.name.trim(),
      status: form.status,
      age_group: form.age_group,
      knowledge_level: form.knowledge_level,
      teacher_id: form.teacher_id!,
      school_id: form.school!,
      course_id: form.course_id,
      student_ids: form.student_ids,
      is_online: form.is_online,
    };

    try {
      if (groupId) {
        await updateGroup({ id: groupId, data: payload }).unwrap();
      } else {
        await createGroup(payload).unwrap();
      }

      onSubmitSuccess?.();
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        api: formatApiError(error, "Не вдалося зберегти групу."),
      }));
    }
  };

  useEffect(() => {
    if (!initialData) {
      setForm(defaultForm);
      setErrors({});
      return;
    }

    const teacherId = getEntityId((initialData as any).teacher_id) ?? getEntityId(initialData.teacher);
    const courseId = getEntityId((initialData as any).course_id) ?? getEntityId(initialData.course);
    const schoolId = getEntityId((initialData as any).school_id) ?? getEntityId(initialData.school);

    setForm({
      name: initialData.name ?? "",
      status: initialData.status ?? StatusEnum.recruiting,
      age_group: initialData.age_group ?? AgeGroupEnum.kids,
      knowledge_level: initialData.knowledge_level ?? KnowledgeLevelEnum.beginner,
      teacher_id: teacherId,
      course_id: courseId,
      school: schoolId,
      student_ids: Array.isArray(initialData.students)
        ? initialData.students
            .map((student) => student.id)
            .filter((id): id is number => typeof id === "number")
        : [],
      is_online: Boolean(initialData.is_online),
    });

    setErrors({});
  }, [initialData, defaultForm]);

  return (
    <div className="grid w-full max-w-7xl grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="max-w-4xl space-y-8 rounded-2xl border bg-background p-8 shadow-sm">
        {errors.api ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errors.api}
          </div>
        ) : null}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Основна інформація</h2>

          <div className="space-y-2" data-field-root>
            <RequiredLabel required className="text-sm text-muted-foreground">
              Назва групи
            </RequiredLabel>
            <Input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Напр. Kids A1"
              aria-invalid={!!errors.name}
            />
            {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <RequiredLabel className="text-sm text-muted-foreground">Статус</RequiredLabel>
              <Select value={form.status} onValueChange={(value) => update("status", value as StatusEnum)}>
                <SelectTrigger>
                  <SelectValue>{STATUS_LABELS[form.status]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <RequiredLabel className="text-sm text-muted-foreground">Вікова група</RequiredLabel>
              <Select
                value={form.age_group}
                onValueChange={(value) => update("age_group", value as AgeGroupEnum)}
              >
                <SelectTrigger>
                  <SelectValue>{AGE_GROUP_LABELS[form.age_group]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AGE_GROUP_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <RequiredLabel className="text-sm text-muted-foreground">Рівень знань</RequiredLabel>
              <Select
                value={form.knowledge_level}
                onValueChange={(value) => update("knowledge_level", value as KnowledgeLevelEnum)}
              >
                <SelectTrigger>
                  <SelectValue>{KNOWLEDGE_LEVEL_LABELS[form.knowledge_level]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(KNOWLEDGE_LEVEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2" data-field-root>
              <RequiredLabel required className="text-sm text-muted-foreground">
                Викладач
              </RequiredLabel>
              <Select
                value={form.teacher_id ? String(form.teacher_id) : ""}
                onValueChange={(value) => update("teacher_id", Number(value))}
                disabled={teachersLoading}
              >
                <SelectTrigger aria-invalid={!!errors.teacher_id}>
                  <SelectValue placeholder="Оберіть викладача" />
                </SelectTrigger>
                <SelectContent>
                  {teacherOptions.map((teacher: any) => (
                    <SelectItem key={teacher.id} value={String(teacher.id)}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.teacher_id ? (
                <p className="text-sm text-destructive">{errors.teacher_id}</p>
              ) : null}
            </div>

            <div className="space-y-2" data-field-root>
              <RequiredLabel required className="text-sm text-muted-foreground">
                Школа
              </RequiredLabel>
              <div className={errors.school ? "rounded-xl border border-destructive p-2" : ""}>
                <SchoolPickerDefault
                  value={form.school}
                  onChange={(id) => update("school", id)}
                />
              </div>
              {errors.school ? <p className="text-sm text-destructive">{errors.school}</p> : null}
            </div>

            <div className="space-y-2">
              <RequiredLabel className="text-sm text-muted-foreground">Студенти</RequiredLabel>
              <StudentPicker value={form.student_ids} onChange={(ids) => update("student_ids", ids)} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/40 p-4">
          <div>
            <p className="font-medium">Онлайн група</p>
            <p className="text-sm text-muted-foreground">Навчання відбувається дистанційно</p>
          </div>
          <Checkbox checked={form.is_online} onCheckedChange={(value) => update("is_online", Boolean(value))} />
        </div>

        <div className="border-t pt-4">
          <Button
            className="h-11 w-full text-base"
            disabled={isCreating || isUpdating}
            onClick={submit}
          >
            {groupId ? "Зберегти зміни" : "Створити групу"}
          </Button>
        </div>
      </div>

      <div className="sticky top-6 h-fit rounded-2xl border bg-muted/20 p-5">
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Курс</h3>
            <p className="text-xs text-muted-foreground">Поточний курс групи</p>
          </div>

          <CoursePicker value={form.course_id} onChange={(id) => update("course_id", id)} />
        </div>
      </div>
    </div>
  );
}
