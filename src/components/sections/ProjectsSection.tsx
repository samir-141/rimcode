"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { projects } from "@/data/projects";
import { Project } from "@/types";
import { ProjectCard } from "./projects/ProjectCard";
import { ProjectModal } from "./projects/ProjectModal";

export function ProjectsSection() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [initialModalTab, setInitialModalTab] = useState<"details" | "iframe">("details");

  const handleOpenDetails = (project: Project, tab: "details" | "iframe" = "details") => {
    setSelectedProject(project);
    setInitialModalTab(tab);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  return (
    <section id="proyectos" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        className="absolute top-1/3 right-10 w-[34rem] h-[34rem] bg-violet-600/15 rounded-full blur-[150px] pointer-events-none"
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
            badge="Proyectos & Casos de Estudio"
            badgeVariant="violet"
            title="Soluciones Desarrolladas con"
            highlight="Propósito Real"
            subtitle="Proyectos enfocados en resolver problemas operativos, digitalizar flujos comerciales y crear experiencias interactivas memorables con demos en vivo e iFrames interactivos."
          />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {projects.map((project) => (
            <motion.div key={project.id} variants={cardVariants}>
              <ProjectCard
                project={project}
                onOpenDetails={handleOpenDetails}
              />
            </motion.div>
          ))}
        </motion.div>
      </Container>

      {/* Fluid Details & Interactive iFrame Modal */}
      <ProjectModal
        project={selectedProject}
        initialTab={initialModalTab}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
}
