import { Lesson } from "@/store/lessons/lesson.type";
import { IEvent } from "../interfaces";

export function lessonToEvent(lesson: Lesson): IEvent {
    return {
        id: lesson.id,

        startDate: lesson.start_time,
        endDate: lesson.end_time ?? lesson.start_time,

        title: lesson.topic ?? "",
        description: lesson.description ?? "",

        lessonType: lesson.lesson_type?.id ?? null,
        groupId: lesson.group?.id ?? null,
        status: lesson.status ?? null,

        color: lesson.color_id ? Number(lesson.color_id) : 1,
        color_hex: lesson.color_hex ?? "#3b82f6",
        teacher_id: lesson.teacher?.id ?? 0,

        teacher: {
            id: lesson.teacher?.id,
            full_name: lesson.teacher?.full_name,
        },

        is_online: Boolean(lesson.is_online),
        meet_link: lesson.meet_link ?? null,
        lesson_plan: lesson.lesson_plan ?? "",
        rawLesson: lesson,
    };
}
