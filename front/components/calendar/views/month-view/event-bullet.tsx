import { cva } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/libs/utils";
import { TEventColor } from "../../types";
import { transition } from "../../animations";

const eventBulletVariants = cva("size-2 rounded-full", {
  variants: {
    color: {
      blue: "bg-blue-600 dark:bg-blue-500",
      green: "bg-green-600 dark:bg-green-500",
      red: "bg-red-600 dark:bg-red-500",
      yellow: "bg-yellow-600 dark:bg-yellow-500",
      purple: "bg-purple-600 dark:bg-purple-500",
      orange: "bg-orange-600 dark:bg-orange-500",
      gray: "bg-gray-600 dark:bg-gray-500",
    },
  },
  defaultVariants: {
    color: "blue",
  },
});

export function EventBullet({
  color,
  className,
}: {
  color?: TEventColor | string | number;
  className?: string;
}) {
  const variantColor = typeof color === "string" && isEventColor(color) ? color : "blue";
  const styleColor = typeof color === "string" && color.startsWith("#") ? color : undefined;

  return (
    <motion.div
      className={cn(eventBulletVariants({ color: variantColor, className }))}
      style={styleColor ? { backgroundColor: styleColor } : undefined}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.2 }}
      transition={transition}
    />
  );
}

function isEventColor(value: string): value is TEventColor {
  return ["blue", "green", "red", "yellow", "purple", "orange", "gray"].includes(value);
}
