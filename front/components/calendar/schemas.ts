import { z } from "zod";
import { LessonCategoryEnum } from "@/store/lessons/lesson.type";
import { StaffMeetingTypeEnum } from "@/store/staff-meeting/staff-meeting.type";

const lessonCategorySchema = z.nativeEnum(LessonCategoryEnum);
const staffMeetingTypeSchema = z.nativeEnum(StaffMeetingTypeEnum);

const scheduleItemSchema = z.object({
  day_of_week: z.number().int().min(1).max(7),
  time: z.string().min(1, "Час обов'язковий"),
  lesson_type_id: z.number().optional(),
  is_online: z.boolean().optional(),
});

const commonSchema = z.object({
  mode: z.enum(["teacher", "methodist"]),
  title: z.string().min(1, "Назва обов'язкова"),
  description: z.string().optional().default(""),
  color: z.number().optional(),
  isOnline: z.boolean().default(false),
});

const teacherBaseSchema = commonSchema.extend({
  mode: z.literal("teacher"),
  lessonType: z.number().min(1, "Тип уроку обов'язковий"),
  groupId: z.number().min(1, "Група обов'язкова"),
  status: z.string().min(1, "Статус обов'язковий"),
  category: lessonCategorySchema,
  lessonPlan: z.string().optional().default(""),
  sendForReview: z.boolean().default(false),
});

const teacherSingleSchema = teacherBaseSchema.extend({
  kind: z.literal("teacher_single"),
  isRecurring: z.literal(false),
  startDate: z.date({ required_error: "Початкова дата обов'язкова" }),
  endDate: z.date({ required_error: "Кінцева дата обов'язкова" }),
  recurringStartDate: z.date().optional(),
  recurringEndDate: z.date().optional(),
  schedule: z.array(scheduleItemSchema).default([]),
});

const teacherRecurringSchema = teacherBaseSchema.extend({
  kind: z.literal("teacher_recurring"),
  isRecurring: z.literal(true),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  recurringStartDate: z.date({ required_error: "Початок періоду обов'язковий" }),
  recurringEndDate: z.date({ required_error: "Кінець періоду обов'язковий" }),
  schedule: z.array(scheduleItemSchema).min(1, "Оберіть хоча б один день у розкладі"),
});

const methodistSchema = commonSchema.extend({
  kind: z.literal("methodist"),
  mode: z.literal("methodist"),
  isRecurring: z.literal(false),
  startDate: z.date({ required_error: "Початок обов'язковий" }),
  endDate: z.date({ required_error: "Кінець обов'язковий" }),
  category: staffMeetingTypeSchema,
  attendeeIds: z.array(z.number().int()).default([]),
});

export const eventSchema = z
    .discriminatedUnion("kind", [teacherSingleSchema, teacherRecurringSchema, methodistSchema])
    .superRefine((v, ctx) => {
      if (v.kind === "methodist") {
        if (v.endDate <= v.startDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Кінець має бути пізніше за початок",
            path: ["endDate"],
          });
        }
      }
    });

export type TEventFormData = z.infer<typeof eventSchema>;
