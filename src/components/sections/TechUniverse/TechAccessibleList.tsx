"use client";

import { Technology, TechCategory } from "@/types";
import { technologies } from "@/data/technologies";

interface Props {
  selectedTech: Technology;
  activeCategory: TechCategory;
  onSelectTech: (tech: Technology) => void;
}

export function TechAccessibleList({
  selectedTech,
  activeCategory,
  onSelectTech,
}: Props) {
  const filteredTechs = technologies.filter(
    (t) => activeCategory === "all" || t.category === activeCategory
  );

  return (
    <div className="w-full">
      <h3 className="sr-only">Listado de tecnologías del stack</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredTechs.map((tech) => {
          const isSelected = selectedTech.id === tech.id;
          return (
            <button
              key={tech.id}
              type="button"
              onClick={() => onSelectTech(tech)}
              aria-pressed={isSelected}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                isSelected
                  ? "bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)] scale-[1.02]"
                  : "bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-sm text-white">{tech.name}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: tech.color }}
                />
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">
                {tech.shortDescription}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

