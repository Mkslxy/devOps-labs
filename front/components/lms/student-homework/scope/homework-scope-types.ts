export type HomeworkScope =
    | { kind: "group"; groupId: number }
    | { kind: "student"; studentId: number }
    | { kind: "lesson"; lessonId: number };

export type ScopeUiState = {
    selectedGroupId: number | null;
    selectedLessonId: number | null;
    scopeKind: HomeworkScope["kind"];
};