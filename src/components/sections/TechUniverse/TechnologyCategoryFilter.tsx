"use client";

import { TechCategory } from "@/types";
import { techCategories } from "@/data/technologies";

interface Props {
  activeCategory: TechCategory;
  onSelectCategory: (category: TechCategory) => void;
}

export function TechnologyCategoryFilter({
  activeCategory,
  onSelectCategory,
}: Props) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-xl max-w-2xl mx-auto"
      role="tablist"
      aria-label="Filtro de categorías de tecnologías"
    >
      {techCategories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectCategory(cat.id as TechCategory)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              isActive
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold shadow-[0_0_15px_rgba(0,240,255,0.3)] scale-[1.02]"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isActive
                  ? "bg-slate-950/40 text-cyan-200"
                  : "bg-slate-900 text-slate-500"
              }`}
            >
              {cat.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

