import { HeroSection } from "@/components/sections/HeroSection";
import { TechUniverseSection } from "@/components/sections/TechUniverseSection";
import { LiveDemoSection } from "@/components/sections/LiveDemoSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { ContactSection } from "@/components/sections/ContactSection";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <TechUniverseSection />
      <LiveDemoSection />
      <ProjectsSection />
      <ServicesSection />
      <AboutSection />
      <ProcessSection />
      <ContactSection />
    </div>
  );
}
