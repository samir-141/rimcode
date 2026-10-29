"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/data/site";
import { projectTypes, budgetRanges, buildWhatsAppUrl } from "@/data/contact";
import { validateContactForm } from "@/lib/validations";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  Mail,
  MessageCircle,
  Send,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/Icons";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    projectType: "erp",
    estimatedBudget: "consult",
    message: "",
    honeypot: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const triggerConfetti = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#00f0ff", "#8b5cf6", "#38bdf8", "#10b981"],
      });
    } catch {
      // Ignored if confetti fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const clientValidation = validateContactForm(formData);
    if (!clientValidation.isValid) {
      setErrors(clientValidation.errors);
      toast.error("Por favor, revisa los campos señalados.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setErrors(data.details);
        }
        toast.error(
          data.error || "No se pudo enviar el mensaje. Intenta de nuevo."
        );
        return;
      }

      toast.success("¡Mensaje recibido con éxito!");
      triggerConfetti();

      // Reset form
      setFormData({
        name: "",
        email: "",
        projectType: "erp",
        estimatedBudget: "consult",
        message: "",
        honeypot: "",
      });
    } catch {
      toast.error("Ocurrió un fallo de conexión. Intenta vía WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contacto" className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute bottom-0 right-1/4 w-[36rem] h-[36rem] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none"
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
            badge="Contacto Directo"
            badgeVariant="cyan"
            title="Conversemos sobre tu"
            highlight="Próximo Proyecto"
            subtitle="Cuéntame sobre las necesidades o cuellos de botella de tu negocio y evaluemos la solución técnica más adecuada."
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 items-start">
          {/* Left Column: Direct Communication Channels */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 space-y-6">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Canales de Atención Rápida
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Si prefieres una conversación directa o una consulta rápida,
                puedes escribirme por WhatsApp o enviarme un correo.
              </p>

              <div className="space-y-3">
                {/* WhatsApp */}
                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 hover:border-emerald-400 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-emerald-300 block">
                        WhatsApp Directo
                      </span>
                      <span className="text-sm font-bold text-white">
                        {siteConfig.contact.whatsappFormatted}
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-emerald-400 transition-transform group-hover:translate-x-1" />
                </a>

                {/* Email */}
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 hover:border-cyan-500/40 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-cyan-300 block">
                        Correo Electrónico
                      </span>
                      <span className="text-sm font-bold text-white truncate block">
                        {siteConfig.contact.email}
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-400 transition-transform group-hover:translate-x-1" />
                </a>

                {/* LinkedIn */}
                <a
                  href={siteConfig.contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 hover:border-blue-500/40 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                      <LinkedinIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-blue-300 block">
                        Perfil Profesional
                      </span>
                      <span className="text-sm font-bold text-white">
                        Samir Gómez Alarcón
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-400 transition-transform group-hover:translate-x-1" />
                </a>

                {/* GitHub */}
                <a
                  href={siteConfig.contact.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 hover:border-white/20 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
                      <GithubIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-300 block">
                        Repositorios & Código
                      </span>
                      <span className="text-sm font-bold text-white">
                        github.com/samir-141
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-400 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 relative shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Honeypot field (hidden from real users) */}
                <input
                  type="text"
                  name="honeypot"
                  value={formData.honeypot}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                  className="sr-only"
                  aria-hidden="true"
                />

                {/* Name */}
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Nombre completo o Empresa <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej. Carlos Mendoza o Botica San Pedro"
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-950/80 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                      errors.name
                        ? "border-rose-500 focus:ring-2 focus:ring-rose-500"
                        : "border-white/10 focus:ring-2 focus:ring-cyan-400"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Correo electrónico de contacto <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nombre@empresa.com"
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-950/80 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                      errors.email
                        ? "border-rose-500 focus:ring-2 focus:ring-rose-500"
                        : "border-white/10 focus:ring-2 focus:ring-cyan-400"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Grid: Project Type & Budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Project Type */}
                  <div>
                    <label
                      htmlFor="contact-project-type"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Tipo de Proyecto o Necesidad
                    </label>
                    <select
                      id="contact-project-type"
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                    >
                      {projectTypes.map((pt) => (
                        <option key={pt.id} value={pt.id} className="bg-slate-900">
                          {pt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Budget Range */}
                  <div>
                    <label
                      htmlFor="contact-budget"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Presupuesto orientativo (opcional)
                    </label>
                    <select
                      id="contact-budget"
                      name="estimatedBudget"
                      value={formData.estimatedBudget}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/80 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                    >
                      {budgetRanges.map((b) => (
                        <option key={b.id} value={b.id} className="bg-slate-900">
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Detalla la necesidad o problema a resolver{" "}
                    <span className="text-cyan-400">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Cuéntame sobre los objetivos de tu empresa, qué sistemas utilizas actualmente o qué funcionalidad te gustaría desarrollar..."
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-950/80 text-sm text-white placeholder-slate-500 focus:outline-none transition-all resize-y ${
                      errors.message
                        ? "border-rose-500 focus:ring-2 focus:ring-rose-500"
                        : "border-white/10 focus:ring-2 focus:ring-cyan-400"
                    }`}
                  />
                  {errors.message && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={isSubmitting}
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Mensaje de Consulta</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

