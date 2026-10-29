"use client";

import Image from "next/image";
import { Project } from "@/types";
import { ExternalLink, Globe2, Lock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { GithubIcon } from "@/components/ui/Icons";

interface Props {
  project: Project;
  onOpenDetails: (project: Project, initialTab?: "details" | "iframe") => void;
}

export function ProjectCard({ project, onOpenDetails }: Props) {
  return (
    <div className="group rounded-[2rem] border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(0,240,255,0.15)]">
      {/* Visual Preview Hero Header */}
      <div className="relative w-full h-60 sm:h-64 bg-slate-950 overflow-hidden border-b border-white/10">
        <Image
          src={project.image}
          alt={`Vista previa de ${project.title}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Soft shadow gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Badge variant="cyan">{project.category}</Badge>
        </div>

        <div className="absolute top-4 right-4">
          <span className="text-[11px] font-mono font-semibold px-3 py-1 rounded-full bg-slate-950/85 border border-white/15 text-slate-200 backdrop-blur-md shadow-md">
            {project.statusBadge}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
            {project.title}
          </h3>
          <p className="text-xs sm:text-sm text-cyan-400/90 font-medium mt-1">
            {project.subtitle}
          </p>

          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            {project.summary}
          </p>
        </div>

        {/* Tech Stack Chips */}
        <div className="pt-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Tecnologías clave
          </p>
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950/80 border border-white/10 text-slate-300 group-hover:border-cyan-500/20 transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
          {/* Main Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {project.demoUrl ? (
              <>
                {/* Button to open interactive iFrame view */}
                <button
                  type="button"
                  onClick={() => onOpenDetails(project, "iframe")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 px-3.5 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.25)] active:scale-95"
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Ver en iFrame</span>
                </button>

                {/* Direct Link Button */}
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-white/15 bg-slate-950/80 hover:bg-slate-800 text-slate-200 transition-colors"
                  title="Abrir en enlace directo"
                >
                  <span>En vivo</span>
                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                </a>
              </>
            ) : (
              <a
                href="#demo-erp"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 px-3.5 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.25)] active:scale-95"
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Probar Mini ERP</span>
              </a>
            )}

            {/* Case Study Details Button */}
            <button
              type="button"
              onClick={() => onOpenDetails(project, "details")}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-2 text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Detalles</span>
            </button>
          </div>

          {/* GitHub / Private Status */}
          {project.isPrivateRepo ? (
            <span
              title="Repositorio privado de cliente empresarial"
              className="text-xs text-slate-400 flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded-lg border border-white/5"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Privado</span>
            </span>
          ) : (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Repositorio en GitHub de ${project.title}`}
              className="p-2 rounded-xl bg-slate-950/70 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
