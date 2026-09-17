"use client";

import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

import { STATUS_DAE_LABELS } from "@/store/test-management/test-management.labels";
import { StatusDaeEnum } from "@/store/test-management/test-management.type";
import { usePatchTestVersionMutation } from "@/store/test-management/test-management.api";

type Props = {
    versionId: number;
    status: StatusDaeEnum;
    disabled?: boolean;
};

export function VersionStatusMenu({ versionId, status, disabled }: Props) {
    const [patchVersion, { isLoading }] = usePatchTestVersionMutation();

    const handleChange = async (nextStatus: StatusDaeEnum) => {
        if (disabled) return;
        if (isLoading) return;
        if (nextStatus === status) return;

        await patchVersion({
            id: versionId,
            data: { status: nextStatus },
        }).unwrap();
    };

    if (disabled) {
        return (
            <Badge variant="secondary" className="rounded-full select-none opacity-80">
                {STATUS_DAE_LABELS[status]}
            </Badge>
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button type="button" disabled={isLoading}>
                    <Badge
                        variant="secondary"
                        className="rounded-full cursor-pointer select-none"
                    >
                        {STATUS_DAE_LABELS[status]}
                    </Badge>
                </button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-44 p-1">
                {Object.values(StatusDaeEnum).map((s) => (
                    <button
                        key={s}
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleChange(s)}
                        className={[
                            "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted",
                            s === status ? "bg-muted font-medium" : "",
                        ].join(" ")}
                    >
                        {STATUS_DAE_LABELS[s]}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
}