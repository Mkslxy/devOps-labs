export const COLORS = ["blue", "green", "red", "yellow", "purple", "orange"];

export const getUkrainianMonth = (date: Date): string => {
  const months = [
    "Січень",
    "Лютий",
    "Березень",
    "Квітень",
    "Травень",
    "Червень",
    "Липень",
    "Серпень",
    "Вересень",
    "Жовтень",
    "Листопад",
    "Грудень",
  ];
  return months[date.getMonth()];
};

export const LessonType = {
  "Короткий (60хв)": 1,
  "Довгий (90хв)": 2,
} as const;

export const statusLessonsForTeacher = {
  scheduled: "Заплановано",
  completed: "Завершено",
  cancelled_by_teacher: "Скасовано викладачем",
  cancelled_by_student: "Скасовано учнем",
  cancelled_by_system: "Скасовано системою",
  rescheduled: "Перенесено",
  no_show_group: "Не показувати учням",
};
