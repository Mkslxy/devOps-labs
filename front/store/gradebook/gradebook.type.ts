import {UserFormData} from "@/store/users/user.type";

export enum CategoryEnum {
    classwork = "classwork",
    homework = "homework",
    test = "test",
    speaking = "speaking",
    project = "project",
    task = "task",
}

//GradeBook Grade CRUD ( POST + GET + PATCH + DEL )

export interface GradeFile {
    id: number;
    file: string;
    name?: string;
}

export interface GradeBookGrade {
    id: number;
    category: CategoryEnum;
    value?: number;
    comment?: string;
    student: number;
    column: number;
    files: GradeFile[];
    created_at: string;
    created_by: UserFormData;
}

export interface GradeBookGradeResponse {
    count: number;
    next: string;
    previous: string;
    results: GradeBookGrade[];
}

export interface GradeBookGradePayload {
    category: CategoryEnum;
    value?: number;
    comment?: string;
    student: number;
    column: number;
    uploaded_files: string[];
    deleted_file_ids: string[];
}

//GradeBook Column CRUD ( POST + GET + PATCH + DEL )

export interface GradeBookColumn {
    id: number;
    title: string;
    comment?: string;
    group: number;
    date?: string;
}

export interface GradeBookColumnResponse {
    count: number;
    next: string;
    previous: string;
    results: GradeBookColumn[];
}

export interface GradeBookColumnPayload {
    group: number;
    title: string;
    comment?: string;
    date?: string | string[];
}

//GradeBook Attendance CRUD ( POST + GET + PATCH + DEL )

export enum GradeBookAttendanceCategory{
    present = "present",
    absent = "absent",
    late = "late",
}

export interface GradeBookAttendance {
    id: number;
    column: number;
    student: number;
    category: GradeBookAttendanceCategory;
    late_minutes?: number;
    comment?: string;
    created_at: string;
    created_by: UserFormData;
}

export interface GradeBookAttendanceResponse {
    count: number;
    next: string;
    previous: string;
    results: GradeBookAttendance[];
}

export interface GradeBookAttendancePayload {
    column: number;
    student: number;
    category: GradeBookAttendanceCategory;
    late_minutes?: number;
    comment?: string;
}

//GradeBook Main ( GET )

export type GradebookCellKey = `${number}_${number}`;

export interface GradebookGridStudent {
    id: number;
    full_name: string;
}

export interface GradebookGridColumn {
    id: number;
    title: string;
    date: string;
    has_grades: boolean;
}

export interface GradebookGridFile {
    id: number;
    url: string;
    name: string;
}

export interface GradebookGridCreatedBy {
    id: number;
    full_name: string;
}

export interface GradebookGridGradeItem {
    id: number;
    value: number | null;
    comment: string | null;
    files: GradebookGridFile[];
    created_by: GradebookGridCreatedBy | null;
}

export interface GradebookGridAttendanceItem {
    id: number;
    status: string; // GradeBookAttendanceCategory по факту
    late_minutes: number | null;
    comment: string | null;
}

export interface GradebookGridCell {
    grades: GradebookGridGradeItem[];
    attendance: GradebookGridAttendanceItem[];
}

export interface GradebookGridResponse {
    students: GradebookGridStudent[];
    columns: GradebookGridColumn[];
    cells: Record<string, GradebookGridCell>;
}