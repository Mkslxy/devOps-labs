import { Suspense } from "react";
import StudentStatsPageClient from "@/components/lms/student/StudentStatsPageClient";


export default function StudentStatsPage() {
  return (
    <Suspense fallback={<div>Завантаження...</div>}>
      <StudentStatsPageClient />
    </Suspense>
  );
}
