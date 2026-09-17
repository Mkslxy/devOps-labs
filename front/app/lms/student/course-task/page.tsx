"use client";

import { useGetProfileMeQuery } from "@/store/users/user.api";
import StudentCourseTaskDashboard from "@/components/lms/student-course-task/page";

export default function Page() {
    const { data: me, isLoading, isError } = useGetProfileMeQuery();

    if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Завантаження...</div>;
    if (isError || !me?.id) return <div className="p-4 text-sm text-destructive">Не вдалося завантажити профіль</div>;

    return (
        <div className="p-4">
            <StudentCourseTaskDashboard
                studentId={me.id}
                studentName={me?.full_name ?? undefined}
            />
        </div>
    );
}