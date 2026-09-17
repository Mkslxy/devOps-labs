"use client";

import { useGetGroupsQuery } from "@/store/groups/group.api";
import type { Group } from "@/store/groups/group.type";

export function useStudentGroups() {
    const query = useGetGroupsQuery(
        {
            page: 1,
            page_size: 200,
        },
        {
            refetchOnMountOrArgChange: true,
        }
    );

    const groups: Group[] = query.data?.results ?? [];

    return {
        ...query,
        groups,
    };
}
