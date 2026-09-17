"use client";

import {
    useGetStudentStatsMeQuery,
    useGetStudentStatsMeGroupQuery,
} from "./stats.api";

export type StudentStatsQuery =
    | { mode: "me" }
    | { mode: "me-group"; group_id: number };

export function useStudentStats(query: StudentStatsQuery) {
    const me = useGetStudentStatsMeQuery(undefined, {
        skip: query.mode !== "me",
    });

    const meGroup = useGetStudentStatsMeGroupQuery(
        query.mode === "me-group" ? { group_id: query.group_id } : (undefined as any),
        { skip: query.mode !== "me-group" }
    );

    return query.mode === "me" ? me : meGroup;
}
