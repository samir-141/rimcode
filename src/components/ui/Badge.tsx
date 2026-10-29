import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "cyan" | "violet" | "emerald" | "slate" | "outline";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "cyan",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide transition-colors",
        variant === "cyan" &&
          "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]",
        variant === "violet" &&
          "bg-violet-500/10 text-violet-300 border border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]",
        variant === "emerald" &&
          "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
        variant === "slate" &&
          "bg-slate-800/60 text-slate-300 border border-slate-700/60",
        variant === "outline" &&
          "bg-transparent text-slate-300 border border-white/10",
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full animate-pulse",
            variant === "cyan" && "bg-cyan-400",
            variant === "violet" && "bg-violet-400",
            variant === "emerald" && "bg-emerald-400",
            variant === "slate" && "bg-slate-400",
            variant === "outline" && "bg-white"
          )}
        />
      )}
      {children}
    </span>
  );
}

