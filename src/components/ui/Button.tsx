import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "cyan-glow";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
          "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
          // Sizes
          size === "sm" && "text-xs px-3.5 py-1.5 gap-1.5",
          size === "md" && "text-sm px-5 py-2.5 gap-2",
          size === "lg" && "text-base px-6 py-3.5 gap-2.5",
          // Variants
          variant === "primary" &&
            "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold hover:from-cyan-400 hover:to-blue-500 hover:shadow-[0_0_24px_rgba(6,182,212,0.4)] active:scale-[0.98]",
          variant === "cyan-glow" &&
            "bg-cyan-400 text-slate-950 font-semibold hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] active:scale-[0.98]",
          variant === "secondary" &&
            "bg-slate-900/80 text-white border border-white/10 hover:bg-slate-800/90 hover:border-white/20 active:scale-[0.98] shadow-sm",
          variant === "outline" &&
            "bg-transparent text-slate-200 border border-cyan-500/30 hover:border-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/5 active:scale-[0.98]",
          variant === "ghost" &&
            "bg-transparent text-slate-300 hover:text-white hover:bg-white/5 active:scale-[0.98]",
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

