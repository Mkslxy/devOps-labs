
// GROUP STATS

export interface GroupStats {

}

// STUDENT STATS

export interface TestMetrics {
    taken: number;
    completed: number;
    passed: number;
    avg_percent: number;
    trend: string;
    distribution: Record<string, number>;
    by_question_type: Record<string, number>;
}

export interface HomeWorkMetrics {
    avg_score: number;
}

export interface AttendanceMetrics {
    present_percent: number;
    late_percent: number;
    absent_percent: number;
}

export interface GroupMetrics {
    percentile: number;
}

export interface StudentStats {
    tests: TestMetrics;
    homework: HomeWorkMetrics;
    attendance: AttendanceMetrics;
    overall_score: number;
    group?: GroupMetrics
}