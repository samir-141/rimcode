"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Project } from "@/types";
import {
  X,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Layers,
  HelpCircle,
  UserCheck,
  Globe2,
  RotateCw,
  Monitor,
  Tablet,
  Smartphone,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Props {
  project: Project | null;
  initialTab?: "details" | "iframe";
  onClose: () => void;
}

export function ProjectModal({ project, initialTab = "details", onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"details" | "iframe">("details");
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    if (project) {
      setActiveTab(initialTab);
      setIframeLoading(true);
      setDeviceView("desktop");
    }
  }, [project, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (project) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  const reloadIframe = () => {
    setIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-8 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      onClick={onClose}
    >
      <div
        className={`w-full my-auto rounded-[2rem] border border-white/15 bg-slate-900 shadow-2xl relative overflow-hidden flex flex-col transition-all duration-300 ${
          activeTab === "iframe"
            ? "max-w-6xl max-h-[92vh] h-[90vh]"
            : "max-w-3xl max-h-[90vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-slate-950/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            {/* View Mode Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === "details"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Detalles & Arquitectura</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("iframe")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === "iframe"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Vista en Vivo (iFrame)</span>
                {project.demoUrl && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-colors"
              >
                <span>Abrir en nueva pestaña</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Detailed Case Study View */}
        {activeTab === "details" && (
          <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Visual Preview Header */}
            <div className="relative w-full h-56 sm:h-72 bg-slate-950 rounded-2xl overflow-hidden border border-white/10">
              <Image
                src={project.image}
                alt={`Captura representativa de ${project.title}`}
                fill
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Title & Category */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="cyan">{project.category}</Badge>
                <Badge variant="slate">{project.statusBadge}</Badge>
              </div>
              <h3
                id="project-modal-title"
                className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
              >
                {project.title}
              </h3>
              <p className="text-sm text-cyan-300 font-medium mt-1">
                {project.subtitle}
              </p>
            </div>

            {/* Summary */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {project.summary}
            </p>

            {/* Problem & Objective */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Problema u Objetivo
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {project.problem}
              </p>
            </div>

            {/* Personal Contribution */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-violet-400" />
                Contribución Personal
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {project.personalContribution}
              </p>
            </div>

            {/* Key Features */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Funcionalidades Destacadas
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {project.keyFeatures.map((feat, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs sm:text-sm text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tech Stack Chips */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                Stack Tecnológico Utilizado
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-cyan-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {project.demoUrl ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setActiveTab("iframe")}
                    className="gap-2 text-xs sm:text-sm font-bold"
                  >
                    <Globe2 className="w-4 h-4" />
                    <span>Ver Proyecto en Vivo (iFrame)</span>
                  </Button>
                ) : (
                  <a
                    href="#demo-erp"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                  >
                    <Globe2 className="w-4 h-4" />
                    <span>Probar Simulación Mini ERP en Landing</span>
                  </a>
                )}

                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    <span>Abrir Enlace Directo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <Button type="button" variant="secondary" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Embedded Interactive Live iFrame View */}
        {activeTab === "iframe" && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
            {project.demoUrl ? (
              <>
                {/* Browser Toolbar Controls */}
                <div className="px-4 py-2.5 bg-slate-900 border-b border-white/10 flex items-center justify-between gap-3 text-xs shrink-0">
                  {/* Left: Device Simulator Switches */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setDeviceView("desktop")}
                      className={`p-1.5 rounded-md transition-colors ${
                        deviceView === "desktop"
                          ? "bg-cyan-500/20 text-cyan-300 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title="Vista Escritorio (100%)"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceView("tablet")}
                      className={`p-1.5 rounded-md transition-colors ${
                        deviceView === "tablet"
                          ? "bg-cyan-500/20 text-cyan-300 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title="Vista Tablet (768px)"
                    >
                      <Tablet className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceView("mobile")}
                      className={`p-1.5 rounded-md transition-colors ${
                        deviceView === "mobile"
                          ? "bg-cyan-500/20 text-cyan-300 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title="Vista Móvil (390px)"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Middle: Mock URL Bar */}
                  <div className="flex-1 max-w-xl mx-auto flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-white/10 text-slate-300 font-mono text-[11px] truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="truncate">{project.demoUrl}</span>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={reloadIframe}
                      className="p-1.5 rounded-lg bg-slate-950 border border-white/10 text-slate-400 hover:text-white"
                      title="Recargar vista interactiva"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-950 border border-white/10 text-cyan-400 hover:text-cyan-300"
                      title="Abrir en pestaña completa"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* iFrame Viewport Container */}
                <div className="flex-1 w-full bg-slate-950/90 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
                  {iframeLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 backdrop-blur-sm z-10 pointer-events-none">
                      <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                      <p className="text-xs font-mono text-cyan-300">
                        Cargando entorno en vivo de {project.title}...
                      </p>
                    </div>
                  )}

                  <div
                    className={`h-full transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-white ${
                      deviceView === "desktop"
                        ? "w-full"
                        : deviceView === "tablet"
                        ? "w-[768px] max-w-full"
                        : "w-[390px] max-w-full"
                    }`}
                  >
                    <iframe
                      key={iframeKey}
                      src={project.demoUrl}
                      title={`Demostración interactiva en vivo de ${project.title}`}
                      className="w-full h-full border-0"
                      onLoad={() => setIframeLoading(false)}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
                      loading="lazy"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* If no public demoUrl (e.g. AngiBotica under client private contract) */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <ShieldAlert className="w-10 h-10 mx-auto" />
                </div>
                <h4 className="text-xl font-bold text-white">
                  Proyecto Privado para Cliente
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  AngiBotica es un sistema ERP farmacéutico con base de datos
                  privada desplegado para uso interno exclusivo de boticas.
                </p>
                <div className="pt-2">
                  <a
                    href="#demo-erp"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:from-cyan-300 hover:to-blue-400 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                  >
                    <span>Explorar la Simulación Mini ERP en Vivo</span>
                    <Globe2 className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
