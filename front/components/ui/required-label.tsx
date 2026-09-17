import type { ComponentProps } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/libs/utils";

type RequiredLabelProps = ComponentProps<typeof Label> & {
  required?: boolean;
};

export function RequiredLabel({
  children,
  required = false,
  className,
  ...props
}: RequiredLabelProps) {
  return (
    <Label className={cn("gap-1.5", className)} {...props}>
      <span>{children}</span>
      {required ? (
        <span aria-hidden="true" className="font-semibold text-destructive">
          *
        </span>
      ) : null}
    </Label>
  );
}

