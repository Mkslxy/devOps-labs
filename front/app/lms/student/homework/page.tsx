"use client";

import StudentHomeworkDashboard from "@/components/lms/student-homework/student-homework";
import {useGetProfileMeQuery} from "@/store/users/user.api";

export default function Page() {
  const { data: me, isLoading, isError } = useGetProfileMeQuery();

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Завантаження...</div>;
  if (isError || !me?.id) return <div className="p-4 text-sm text-destructive">Не вдалося завантажити профіль</div>;

  return (
      <div className="p-4">
          <StudentHomeworkDashboard
              studentId={me.id}
              studentName={(me as any)?.full_name ?? (me as any)?.name ?? (me as any)?.first_name ?? undefined}
          />
      </div>
  );
}