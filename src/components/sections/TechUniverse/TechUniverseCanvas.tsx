"use client";

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Technology, TechCategory } from "@/types";
import { technologies } from "@/data/technologies";
import { TechGlobe } from "./TechGlobe";
import { TechNode } from "./TechNode";
import { OrbitLines } from "./OrbitLines";
import { ParticleField } from "./ParticleField";

function GlobeUniverseScene({
  selectedTech,
  activeCategory,
  onSelectTech,
}: {
  selectedTech: Technology;
  activeCategory: TechCategory;
  onSelectTech: (tech: Technology) => void;
}) {
  const universeGroupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (universeGroupRef.current) {
      // Gentle automatic rotation
      universeGroupRef.current.rotation.y += delta * 0.1;

      // Smooth cursor-following tilt
      const targetTiltX = -state.pointer.y * 0.22;
      const targetTiltZ = state.pointer.x * 0.22;
      universeGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        universeGroupRef.current.rotation.x,
        targetTiltX,
        0.05
      );
      universeGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        universeGroupRef.current.rotation.z,
        targetTiltZ,
        0.05
      );
    }
  });

  return (
    <group ref={universeGroupRef}>
      <TechGlobe />
      <OrbitLines />
      <ParticleField count={80} />

      {technologies.map((tech) => (
        <TechNode
          key={tech.id}
          tech={tech}
          isSelected={selectedTech.id === tech.id}
          isCategoryActive={
            activeCategory === "all" || tech.category === activeCategory
          }
          onSelect={onSelectTech}
        />
      ))}
    </group>
  );
}

export function TechUniverseCanvas({
  selectedTech,
  activeCategory,
  onSelectTech,
}: {
  selectedTech: Technology;
  activeCategory: TechCategory;
  onSelectTech: (tech: Technology) => void;
}) {
  return (
    <div
      className="w-full h-[460px] sm:h-[540px] lg:h-[600px] relative select-none"
      role="region"
      aria-label="Globo tecnológico 3D interactivo"
    >
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 44 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 6, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-4, -3, -3]} intensity={1.2} color="#00f0ff" />
        <pointLight position={[4, -2, 2]} intensity={1.2} color="#8b5cf6" />

        <Suspense fallback={null}>
          <GlobeUniverseScene
            selectedTech={selectedTech}
            activeCategory={activeCategory}
            onSelectTech={onSelectTech}
          />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.5}
          dampingFactor={0.06}
          maxPolarAngle={Math.PI / 1.35}
          minPolarAngle={Math.PI / 3.4}
        />
      </Canvas>

      {/* Floating helper hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
        <span className="text-[11px] font-mono text-cyan-300/80 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/20 shadow-xl">
          Arrastra para girar • Clic en nodo para detalles
        </span>
      </div>
    </div>
  );
}
