"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { technologies } from "@/data/technologies";
import { Technology, TechCategory } from "@/types";
import { TechnologyCategoryFilter } from "./TechUniverse/TechnologyCategoryFilter";
import { TechnologyInfoPanel } from "./TechUniverse/TechnologyInfoPanel";
import { TechAccessibleList } from "./TechUniverse/TechAccessibleList";
import { Layers, Globe2 } from "lucide-react";

// Dynamically import Three.js canvas to avoid SSR issues
const TechUniverseCanvas = dynamic(
  () =>
    import("./TechUniverse/TechUniverseCanvas").then(
      (mod) => mod.TechUniverseCanvas
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[460px] sm:h-[540px] lg:h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-cyan-300">
            Renderizando universo tecnológico...
          </span>
        </div>
      </div>
    ),
  }
);

export function TechUniverseSection() {
  const [selectedTech, setSelectedTech] = useState<Technology>(technologies[0]);
  const [activeCategory, setActiveCategory] = useState<TechCategory>("all");
  const [viewMode, setViewMode] = useState<"3d" | "grid">("3d");
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGL(false);
        setViewMode("grid");
      }
    } catch {
      setHasWebGL(false);
      setViewMode("grid");
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setViewMode("grid");
    }
  }, []);

  return (
    <section id="tecnologias" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[36rem] h-[36rem] bg-cyan-600/15 rounded-full blur-[150px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[32rem] h-[32rem] bg-violet-600/15 rounded-full blur-[150px] pointer-events-none"
        aria-hidden="true"
      />

      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeading
            badge="Tech Universe"
            badgeVariant="cyan"
            title="Ecosistema Tecnológico"
            highlight="RimCode"
            subtitle="Herramientas modernas seleccionadas para garantizar solidez arquitectónica, rendimiento superior y máxima mantenibilidad."
          />
        </motion.div>

        {/* Controls: Category Filter and View Mode Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8"
        >
          <TechnologyCategoryFilter
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />

          {hasWebGL && (
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs shadow-lg">
              <button
                type="button"
                onClick={() => setViewMode("3d")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
                  viewMode === "3d"
                    ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Globo 3D</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Modo Cuadrícula</span>
              </button>
            </div>
          )}
        </motion.div>

        {/* Main Content Area */}
        {viewMode === "3d" && hasWebGL ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* 3D Interactive Globe */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-7 rounded-[2.5rem] border border-white/15 bg-slate-950/70 backdrop-blur-2xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              <TechUniverseCanvas
                selectedTech={selectedTech}
                activeCategory={activeCategory}
                onSelectTech={setSelectedTech}
              />
            </motion.div>

            {/* Dynamic Information Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-5 h-full"
            >
              <TechnologyInfoPanel tech={selectedTech} />
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <TechAccessibleList
                selectedTech={selectedTech}
                activeCategory={activeCategory}
                onSelectTech={setSelectedTech}
              />
            </div>
            <div className="lg:col-span-5">
              <TechnologyInfoPanel tech={selectedTech} />
            </div>
          </div>
        )}

        {/* Accessible alternative summary for screen readers always in DOM */}
        <div className="sr-only">
          <h3>Resumen del stack tecnológico</h3>
          <p>
            Tecnología actualmente inspeccionada: {selectedTech.name}. Uso
            principal: {selectedTech.primaryUse}.
          </p>
        </div>
      </Container>
    </section>
  );
}
