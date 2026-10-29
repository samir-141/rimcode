import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

export interface SectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  badge?: string;
  badgeVariant?: "cyan" | "violet" | "emerald" | "slate";
  title: string;
  highlight?: string;
  subtitle?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  className,
  badge,
  badgeVariant = "cyan",
  title,
  highlight,
  subtitle,
  align = "center",
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 mb-12 sm:mb-16",
        align === "center" ? "items-center text-center max-w-3xl mx-auto" : "items-start text-left max-w-2xl",
        className
      )}
      {...props}
    >
      {badge && (
        <Badge variant={badgeVariant} dot>
          {badge}
        </Badge>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
        {title}{" "}
        {highlight && (
          <span className="gradient-text-cyan-violet">{highlight}</span>
        )}
      </h2>
      {subtitle && (
        <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

