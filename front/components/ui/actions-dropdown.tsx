"use client";

import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ActionsDropdownItem {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  closeOnClick?: boolean;
  content?: ReactNode;
}

interface ActionsDropdownProps {
  items: ActionsDropdownItem[];
  align?: "start" | "center" | "end";
  widthClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export default function ActionsDropdown({
                                          items,
                                          align = "end",
                                          widthClassName = "w-52",
                                          triggerClassName,
                                          contentClassName,
                                        }: ActionsDropdownProps) {
  const visibleItems = items.filter((item) => !item.hidden);

  if (!visibleItems.length) {
    return null;
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={
              triggerClassName ||
              "h-10 w-10 rounded-full border border-border bg-background hover:bg-accent"
            }
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={align}
          className={`${widthClassName} rounded-2xl ${contentClassName || ""}`}
        >
          {visibleItems.map((item) => {
            if (item.content) {
              return <div key={item.key}>{item.content}</div>;
            }

            return (
              <DropdownMenuItem
                key={item.key}
                disabled={item.disabled}
                onSelect={(e) => {
                  if (item.closeOnClick === false) {
                    e.preventDefault();
                  }

                  item.onClick?.();
                }}
                className={
                  item.destructive
                    ? "cursor-pointer text-destructive focus:text-destructive"
                    : "cursor-pointer"
                }
              >
                {item.icon ? (
                  <span className="mr-2 flex h-4 w-4 items-center justify-center">
                                        {item.icon}
                                    </span>
                ) : null}

                <span>{item.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
