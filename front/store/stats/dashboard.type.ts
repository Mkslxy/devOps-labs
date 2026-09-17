export interface RecentLead {
    id: number;
    name: string;
    phone: string | null;
    status: string;
    source: string;
    created_at: string;
}

export interface ChartData {
    date: string;
    display_date: string;
    leads: number;
    lessons: number;
}

export interface ManagerDashboard {
    total_students: number;
    total_teachers: number;
    total_groups: number;
    new_leads: number;
    completed_lessons_this_month: number;
    recent_leads: RecentLead[];
    chart_data: ChartData[];
}

export interface DashboardUpcomingLesson {
    time: string;
    student: string;
    students: number;
    type: string;
}

export interface DashboardTaskForReview {
    student: string;
    assignment: string;
    submitted: string;
    course: string;
}

export interface DashboardStudent {
    name: string;
    course: string;
    progress: number;
    attendance: string;
}

export interface TeacherDashboard {
    active_students: number;
    active_groups: number;
    lessons_this_week: number;
    planned_lessons_this_week: number;
    hours_worked_this_month: number;
    upcoming_lessons: DashboardUpcomingLesson[];
    tasks_for_review: DashboardTaskForReview[];
    recent_students: DashboardStudent[];
}

export interface StudentDashboardUpcomingLesson {
    course: string;
    teacher: string;
    time: string;
    duration: string;
}

export interface StudentDashboardProgress {
    course: string;
    progress: number;
    lessons_completed: number;
    lessons_total: number;
}

export interface StudentDashboardHomeworkTask {
    title: string;
    course: string;
    deadline: string;
    status: string;
}

export interface StudentDashboard {
    active_courses: number;
    lessons_left: number;
    lessons_total_paid: number;
    attendance_percent: number;
    achievements_count: number;
    upcoming_lessons: StudentDashboardUpcomingLesson[];
    learning_progress: StudentDashboardProgress[];
    homework_tasks: StudentDashboardHomeworkTask[];
}
