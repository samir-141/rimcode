"use client";

import { Technology } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  CheckCircle2,
  Sparkles,
  FolderGit2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function TechnologyInfoPanel({ tech }: { tech: Technology }) {
  const categoryLabels: Record<string, string> = {
    frontend: "Frontend & UI",
    backend: "Backend & APIs",
    database: "Bases de Datos & ORM",
    "devops-tools": "DevOps & Herramientas",
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
      {/* Top ambient color glow reflecting current tech color */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-20 transition-all duration-500"
        style={{ backgroundColor: tech.color }}
        aria-hidden="true"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={tech.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="cyan">
                  {categoryLabels[tech.category] || tech.category}
                </Badge>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: tech.color }}
                />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {tech.name}
              </h3>
            </div>

            <a
              href={tech.docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition-colors shrink-0"
              aria-label={`Documentación oficial de ${tech.name}`}
            >
              <span>Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Descripción
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {tech.fullDescription}
            </p>
          </div>

          {/* Primary Use in RimCode Projects */}
          <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-white/5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Uso Principal en Proyectos
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
              {tech.primaryUse}
            </p>
          </div>

          {/* Key Advantages / Benefits */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Ventajas Relevantes
            </h4>
            <ul className="space-y-2">
              {tech.keyBenefits.map((benefit, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Related Projects */}
          {tech.relatedProjects && tech.relatedProjects.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-violet-400" />
                Implementado en
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {tech.relatedProjects.map((proj) => (
                  <span
                    key={proj}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-300 font-mono"
                  >
                    #{proj}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

