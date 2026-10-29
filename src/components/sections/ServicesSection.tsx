"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { services } from "@/data/services";
import { buildWhatsAppUrl } from "@/data/contact";
import {
  LayoutDashboard,
  Code,
  ShoppingBag,
  Cpu,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export function ServicesSection() {
  const iconMap: Record<string, React.ReactNode> = {
    LayoutDashboard: <LayoutDashboard className="w-5 h-5 text-cyan-400" />,
    Code: <Code className="w-5 h-5 text-violet-400" />,
    ShoppingBag: <ShoppingBag className="w-5 h-5 text-blue-400" />,
    Cpu: <Cpu className="w-5 h-5 text-emerald-400" />,
    Zap: <Zap className="w-5 h-5 text-cyan-400" />,
    ShieldCheck: <ShieldCheck className="w-5 h-5 text-violet-400" />,
  };

  return (
    <section id="servicios" className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[30rem] h-[30rem] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none"
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
            badge="Servicios Especializados"
            badgeVariant="cyan"
            title="Soluciones Tecnológicas a la"
            highlight="Medida de tu Negocio"
            subtitle="Enfoque directo en resolver ineficiencias operativas y desarrollar activos digitales que ahorren tiempo y permitan escalar tus operaciones."
          />
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => {
            const isLarge = srv.colSpan === "large";

            return (
              <div
                key={srv.id}
                className={`group rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_12px_35px_rgba(0,0,0,0.35)] ${
                  isLarge ? "md:col-span-2 lg:col-span-2" : "col-span-1"
                }`}
              >
                <div className="space-y-4">
                  {/* Top Icon & Tagline */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 shadow-md">
                      {iconMap[srv.icon] || (
                        <Code className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-950/80 px-3 py-1 rounded-full border border-white/5">
                      Servicio Especializado
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                      {srv.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-cyan-400 font-medium mt-1">
                      {srv.tagline}
                    </p>
                  </div>

                  {/* Problem & Solution */}
                  <div className="space-y-2.5 pt-1">
                    <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-white/5 text-xs text-slate-300">
                      <span className="font-semibold text-rose-400 block mb-1">
                        El problema habitual:
                      </span>
                      {srv.problem}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 text-xs text-slate-300">
                      <span className="font-semibold text-emerald-400 block mb-1">
                        La solución RimCode:
                      </span>
                      {srv.solution}
                    </div>
                  </div>

                  {/* Expected Benefit */}
                  <div className="text-xs text-slate-300 pt-1">
                    <span className="font-semibold text-slate-200">
                      Beneficio esperado:{" "}
                    </span>
                    <span>{srv.expectedBenefit}</span>
                  </div>

                  {/* Deliverables */}
                  <div className="pt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Entregables Clave:
                    </p>
                    <ul className="space-y-1.5">
                      {srv.deliverables.map((deliv, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{deliv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="pt-6 mt-6 border-t border-white/5">
                  <a
                    href={buildWhatsAppUrl(
                      `Hola Samir, me interesa consultar sobre el servicio de: ${srv.title}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 group-hover:translate-x-1 transition-all"
                  >
                    <span>Consultar este servicio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

