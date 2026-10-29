import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: "none" | "cyan" | "violet" | "emerald";
  hoverEffect?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glow = "none", hoverEffect = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl border p-6 overflow-hidden",
          "bg-slate-900/60 backdrop-blur-xl border-white/10",
          hoverEffect &&
            "transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
          glow === "cyan" &&
            "border-cyan-500/30 shadow-[0_0_25px_rgba(0,240,255,0.12)]",
          glow === "violet" &&
            "border-violet-500/30 shadow-[0_0_25px_rgba(139,92,246,0.12)]",
          glow === "emerald" &&
            "border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.12)]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

