import {CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

type HeaderStepProps<T extends string> = {
    title?: string;
    step: T;
    descriptions: Record<T, string>;
    size?: "sm" | "md";
};

export function HeaderStep<T extends string>({
                                                 title,
                                                 step,
                                                 descriptions,
                                                 size = "md",
                                             }: HeaderStepProps<T>) {
    const sizes = {
        md: {
            box: "w-16 h-16 rounded-xl",
            text: "text-2xl",
            margin: "mb-4",
        },
        sm: {
            box: "w-12 h-12 rounded-lg",
            text: "text-lg",
            margin: "mb-2",
        },
    };

    const s = sizes[size];

    return (
        <CardHeader className="space-y-1">
            <div className={`flex justify-center ${s.margin}`}>
                <div
                    className={`${s.box} bg-primary flex items-center justify-center`}
                >
          <span
              className={`text-primary-foreground font-bold ${s.text}`}
          >
            UN
          </span>
                </div>
            </div>

            <CardTitle className="text-2xl text-center">
                {title}
            </CardTitle>

            <CardDescription className="text-center">
                {descriptions[step]}
            </CardDescription>
        </CardHeader>
    );
}
