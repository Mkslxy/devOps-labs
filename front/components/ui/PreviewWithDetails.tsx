import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PreviewWithDetailsProps<T> {
    items: T[] | null | undefined;

    getLabel: (item: T) => string;
    renderDetails: (item: T) => React.ReactNode;

    emptyLabel?: string;
    maxPreviewItems?: number;

    variant?: "desktop" | "mobile";
}

export function PreviewWithDetails<T>({
                                          items,
                                          getLabel,
                                          renderDetails,
                                          emptyLabel = "Немає",
                                          maxPreviewItems = 2,
                                          variant = "desktop",
                                      }: PreviewWithDetailsProps<T>) {
    if (!items || items.length === 0) {
        return <span className="text-muted-foreground">{emptyLabel}</span>;
    }

    if (variant === "desktop") {
        const previewText = items
            .slice(0, maxPreviewItems)
            .map(getLabel)
            .join(", ");

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="truncate cursor-help">
                        {previewText}
                        {items.length > maxPreviewItems && (
                            <span className="text-muted-foreground">
                                {" "}+{items.length - maxPreviewItems}
                            </span>
                        )}
                    </div>
                </TooltipTrigger>

                <TooltipContent side="bottom" className="max-w-xs p-3">
                    <div className="text-sm space-y-1">
                        {items.map((item, idx) => (
                            <div key={idx} className="whitespace-normal break-words">
                                {renderDetails(item)}
                            </div>
                        ))}
                    </div>
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <div className="flex flex-col items-end min-w-0 text-right">
            <p className="text-sm truncate max-w-full">
                {items.slice(0, maxPreviewItems).map(getLabel).join(", ")}
                {items.length > maxPreviewItems && (
                    <span className="text-muted-foreground">
                        {" "}+{items.length - maxPreviewItems}
                    </span>
                )}
            </p>

            <details>
                <summary className="text-xs text-primary cursor-pointer list-none">
                    Показати всіх
                </summary>

                <ul className="mt-1 space-y-1 break-all">
                    {items.map((item, idx) => (
                        <li key={idx} className="text-sm">
                            {renderDetails(item)}
                        </li>
                    ))}
                </ul>
            </details>
        </div>
    );
}
