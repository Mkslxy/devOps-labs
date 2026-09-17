import type { Homework, HomeWorkSubmission } from "@/store/homework/homework.type";

export function buildSubmissionMap(submissions: HomeWorkSubmission[]): Map<number, HomeWorkSubmission> {
    const map = new Map<number, HomeWorkSubmission>();
    for (const sub of submissions) {
        const hwId = (sub as any)?.homework ?? (sub as any)?.homework_id ?? (sub as any)?.homework?.id;
        if (typeof hwId === "number") {
            map.set(hwId, sub);
        }
    }
    return map;
}

export function calcDerived(
    homework: Homework[],
    submissionByHomeworkId: Map<number, HomeWorkSubmission>
) {
    const now = Date.now();

    const active: Homework[] = [];
    const submitted: { hw: Homework; sub: HomeWorkSubmission }[] = [];
    const graded: { hw: Homework; sub: HomeWorkSubmission }[] = [];
    const upcoming: Homework[] = [];

    for (const hw of homework) {
        const sub = submissionByHomeworkId.get(hw.id);
        const deadline = hw.deadline ? new Date(hw.deadline).getTime() : null;
        const isDeadlinePassed = deadline !== null && !Number.isNaN(deadline) ? deadline < now : false;

        if (!sub) {
            active.push(hw);
            if (deadline !== null && !isDeadlinePassed) {
                upcoming.push(hw);
            }
        } else {
            const gradeValue = (sub as any)?.grade?.value ?? null;
            const hasGrade = gradeValue !== null && String(gradeValue).trim() !== "" && String(gradeValue) !== "Немає";
            if (hasGrade) {
                graded.push({ hw, sub });
            } else {
                submitted.push({ hw, sub });
            }
        }
    }

    upcoming.sort((a, b) => {
        const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
        const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
        return aTime - bTime;
    });

    return {
        active,
        submitted,
        graded,
        upcoming,
    };
}
