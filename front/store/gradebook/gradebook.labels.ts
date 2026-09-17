import {
    CategoryEnum, GradeBookAttendanceCategory,
} from "./gradebook.type";

export const CATEGORY_LABELS: Record<CategoryEnum, string> = {
    [CategoryEnum.classwork]: "Класна робота",
    [CategoryEnum.homework]: "Домашня робота",
    [CategoryEnum.test]: "Контрольна робота",
    [CategoryEnum.speaking]: "Усне мовлення",
    [CategoryEnum.project]: "Проєкт",
    [CategoryEnum.task]: "Завдання"
};

export const GRADE_BOOK_ATTENDANCE_CATEGORY_LABELS: Record<GradeBookAttendanceCategory, string> = {
    [GradeBookAttendanceCategory.present]: "Присутній",
    [GradeBookAttendanceCategory.absent]: "Відсутній",
    [GradeBookAttendanceCategory.late]: "Запізнення",
};

