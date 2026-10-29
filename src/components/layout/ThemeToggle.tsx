"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Cambiar tema visual"
        className="w-9 h-9 rounded-xl border border-white/10 bg-slate-900/60 flex items-center justify-center text-slate-400 opacity-60"
        disabled
      >
        <Moon className="w-4 h-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="w-9 h-9 rounded-xl border border-white/10 dark:border-white/10 light:border-slate-300 bg-slate-900/70 hover:bg-slate-800/80 text-cyan-400 hover:text-cyan-300 dark:text-cyan-400 light:text-slate-700 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 hover:-rotate-12 text-slate-800" />
      )}
    </button>
  );
}

