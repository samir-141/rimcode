"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  Search,
  CalendarCheck,
  Palette,
  Code2,
  Rocket,
  ArrowRight,
} from "lucide-react";

export function ProcessSection() {
  const steps = [
    {
      step: "01",
      title: "Descubrimiento",
      subtitle: "Entender la necesidad y el contexto operativo",
      description:
        "Analizamos juntos cómo funciona tu negocio actualmente, dónde se pierden horas y qué información clave necesitas controlar en tiempo real.",
      icon: <Search className="w-5 h-5 text-cyan-400" />,
    },
    {
      step: "02",
      title: "Planificación",
      subtitle: "Definir alcance, prioridades y entregables",
      description:
        "Establecemos un plan de trabajo claro con módulos priorizados, plazos realistas y entregables definidos sin letra chica ni falsas promesas.",
      icon: <CalendarCheck className="w-5 h-5 text-blue-400" />,
    },
    {
      step: "03",
      title: "Diseño & Arquitectura",
      subtitle: "Organizar la experiencia y el flujo de datos",
      description:
        "Estructuramos la base de datos relacional y modelamos las pantallas para que cualquier persona del equipo pueda operar el sistema sin complicaciones.",
      icon: <Palette className="w-5 h-5 text-violet-400" />,
    },
    {
      step: "04",
      title: "Desarrollo & Pruebas",
      subtitle: "Implementar con tipado estricto y validar",
      description:
        "Escribimos código limpio con TypeScript, Next.js y backend modular. Realizamos comprobaciones exhaustivas de validaciones e integridad de datos.",
      icon: <Code2 className="w-5 h-5 text-emerald-400" />,
    },
    {
      step: "05",
      title: "Entrega & Mejora",
      subtitle: "Publicar, documentar y acompañar",
      description:
        "Desplegamos la aplicación en un entorno seguro, facilitamos una guía de uso clara y quedamos a disposición para soporte técnico y futuras etapas.",
      icon: <Rocket className="w-5 h-5 text-cyan-400" />,
    },
  ];

  return (
    <section id="proceso" className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute bottom-10 left-1/3 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px] pointer-events-none"
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
            badge="Metodología de Trabajo"
            badgeVariant="violet"
            title="Cómo Trabajamos Juntos"
            highlight="Paso a Paso"
            subtitle="Un proceso estructurado en cinco fases para convertir tus requerimientos en una solución estable y predecible."
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 relative">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="group p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/30 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
            >
              {/* Step number watermark */}
              <div
                className="absolute top-2 right-4 text-4xl font-mono font-extrabold text-white/5 select-none pointer-events-none"
                aria-hidden="true"
              >
                {item.step}
              </div>

              <div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 w-fit mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-mono text-cyan-400 font-bold mb-1">
                  FASE {item.step}
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1 mb-3">
                  {item.subtitle}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-slate-600 pointer-events-none">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

