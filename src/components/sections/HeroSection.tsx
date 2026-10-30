"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { siteConfig } from "@/data/site";
import { Container } from "@/components/ui/Container";
import {
  ArrowRight,
  Database,
  Code2,
  Server,
  Layers,
  CheckCircle2,
  Zap,
} from "lucide-react";

// Lazy-load 3D avatar with styled fallback
const Avatar3D = dynamic(
  () =>
    import("@/components/sections/Avatar3D/Avatar3D").then((mod) => mod.Avatar3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[480px] sm:h-[550px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-cyan-300">
            Iniciando interfaz 3D...
          </span>
        </div>
      </div>
    ),
  }
);

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  return (
    <section className="relative min-h-[95vh] flex items-center justify-center pt-28 pb-16 sm:py-32 overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-cyan-500/15 rounded-full blur-[150px] pointer-events-none animate-pulse"
        style={{ animationDuration: "8s" }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 right-1/4 translate-x-1/3 translate-y-1/3 w-[38rem] h-[38rem] bg-violet-600/15 rounded-full blur-[160px] pointer-events-none animate-pulse"
        style={{ animationDuration: "10s" }}
        aria-hidden="true"
      />

      {/* Subtle digital grid overlay */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf80d_1px,transparent_1px),linear-gradient(to_bottom,#38bdf80d_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none"
        aria-hidden="true"
      />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* ================= LEFT COLUMN: HEADLINE & CTAs ================= */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 flex flex-col items-start text-left z-10 space-y-6"
          >
            {/* Availability Pill */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-300 tracking-wide">
                {siteConfig.availabilityStatus.text}
              </span>
            </motion.div>

            {/* Main Value Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-white leading-[1.1]"
            >
              Transformo problemas de negocio en{" "}
              <span className="gradient-text-cyan-violet">
                soluciones digitales funcionales.
              </span>
            </motion.h1>

            {/* Subheadline Description */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed"
            >
              {siteConfig.subheadline}
            </motion.p>

            {/* Specialty Highlights Pill Grid */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg pt-1"
            >
              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-sm">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Sistemas ERP & POS</p>
                  <p className="text-[11px] text-slate-400">
                    Control de stock, kardex y ventas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-sm">
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 shrink-0">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Full-Stack Moderno</p>
                  <p className="text-[11px] text-slate-400">
                    Next.js, NestJS y PostgreSQL
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTAs with Luminous Hover */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <a
                href="#contacto"
                className="group relative inline-flex items-center gap-2.5 text-sm sm:text-base font-bold px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 text-slate-950 transition-all duration-300 shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:shadow-[0_0_45px_rgba(0,240,255,0.6)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                <span>Hablemos de tu proyecto</span>
                <ArrowRight className="w-4 h-4 stroke-[2.8] transition-transform duration-200 group-hover:translate-x-1" />
              </a>

              <a
                href="#proyectos"
                className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold px-6 py-4 rounded-2xl border border-white/15 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white transition-all duration-200 hover:border-cyan-400/40 active:scale-[0.98] shadow-md"
              >
                Explorar proyectos
              </a>
            </motion.div>
          </motion.div>

          {/* ================= RIGHT COLUMN: 3D CYBER AVATAR PROTAGONIST ================= */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-6 relative flex items-center justify-center"
          >
            {/* Outer Stage Container matching the reference model layout */}
            <div className="w-full relative rounded-[2.5rem] border border-cyan-500/25 bg-gradient-to-b from-[#091024] via-[#050b18] to-[#02050e] p-3 sm:p-5 shadow-[0_25px_70px_rgba(0,0,0,0.7),0_0_50px_rgba(0,240,255,0.15)] overflow-hidden">
              {/* Internal Cosmic Galaxy Glow */}
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,240,255,0.2)_0%,rgba(168,85,247,0.15)_45%,transparent_75%)] pointer-events-none"
                aria-hidden="true"
              />

              {/* --- 4 REFINED CORNER BADGES (Exact layout from reference) --- */}
              {/* Badge 1: Top-Left - Sistemas ERP & POS */}
              <div className="absolute top-5 left-5 z-20 pointer-events-none flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-cyan-400/50 backdrop-blur-xl shadow-[0_0_20px_rgba(0,240,255,0.25)] text-xs font-mono font-bold text-cyan-300">
                <span className="p-1 rounded-full bg-cyan-500/20 text-cyan-400">
                  <Zap className="w-3 h-3 fill-cyan-400" />
                </span>
                <span>Sistemas ERP & POS</span>
              </div>

              {/* Badge 2: Top-Right - React + NestJS */}
              <div className="absolute top-5 right-5 z-20 pointer-events-none flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-violet-400/50 backdrop-blur-xl shadow-[0_0_20px_rgba(168,85,247,0.25)] text-xs font-mono font-bold text-violet-300">
                <span className="p-1 rounded-full bg-violet-500/20 text-violet-400">
                  <Server className="w-3 h-3" />
                </span>
                <span>React + NestJS</span>
              </div>

              {/* Badge 3: Bottom-Left - Kardex en Tiempo Real */}
              <div className="absolute bottom-5 left-5 z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-emerald-400/50 backdrop-blur-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] text-xs font-mono font-bold text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kardex en Tiempo Real</span>
              </div>

              {/* Badge 4: Bottom-Right - PostgreSQL + Prisma */}
              <div className="absolute bottom-5 right-5 z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-cyan-400/40 backdrop-blur-xl shadow-[0_0_20px_rgba(0,240,255,0.2)] text-xs font-mono font-bold text-cyan-300">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>PostgreSQL + Prisma</span>
              </div>

              {/* The 3D Scene */}
              <Avatar3D />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
