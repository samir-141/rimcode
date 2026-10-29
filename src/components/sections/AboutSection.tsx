"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/data/site";
import {
  Terminal,
  Sparkles,
  Database,
} from "lucide-react";

export function AboutSection() {
  return (
    <section id="sobre-mi" className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none"
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
            badge="Sobre Mí"
            badgeVariant="cyan"
            title="Quién está detrás de"
            highlight="RimCode"
            subtitle="Desarrollo de software orientado a resolver problemas cotidianos en empresas reales, combinando rigor técnico y cercanía en el trato."
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Developer Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 relative overflow-hidden shadow-2xl">
              {/* Profile Avatar / Tech Symbol */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 p-0.5 mb-6 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                  <Terminal className="w-10 h-10 text-cyan-400 stroke-[2.2]" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white tracking-tight">
                {siteConfig.developer}
              </h3>
              <p className="text-sm font-semibold text-cyan-400 mt-1">
                {siteConfig.role} & Creador de RimCode
              </p>

              <div className="space-y-3.5 mt-6 pt-6 border-t border-white/10 text-sm text-slate-300">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Enfoque en desarrollo Full-Stack con TypeScript</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Especialización en sistemas de gestión ERP e inventarios</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  <span>Bases de datos relacionales PostgreSQL y APIs robustas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Approach & Philosophy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              <p>
                RimCode nació de una observación constante: muchas pequeñas y
                medianas empresas operan con herramientas improvisadas que
                dificultan su día a día. Procesos críticos de ventas, almacén y
                facturación terminan dispersos en libretas u hojas de cálculo
                desarticuladas.
              </p>
              <p>
                Mi trabajo como desarrollador consiste en tomar esa complejidad
                operativa y traducirla en aplicaciones web limpias, rápidas y
                confiables. No busco utilizar tecnologías por simple novedad,
                sino elegir la arquitectura más sólida para que el sistema
                funcione sin sobresaltos a lo largo del tiempo.
              </p>
            </div>

            {/* Approach Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                  <Database className="w-4 h-4" />
                  <span>Frontend + Backend Unificados</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Conexión directa entre interfaces intuitivas y modelos de
                  datos relacionales con estricta integridad ACID.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-violet-400 font-semibold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Mantenibilidad y Código Limpio</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tipado estricto con TypeScript para facilitar cambios futuros
                  y evitar errores inesperados en producción.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

