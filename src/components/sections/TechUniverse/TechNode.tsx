"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Technology } from "@/types";

interface TechNodeProps {
  tech: Technology;
  isSelected: boolean;
  isCategoryActive: boolean;
  onSelect: (tech: Technology) => void;
}

export function TechNode({
  tech,
  isSelected,
  isCategoryActive,
  onSelect,
}: TechNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [isFrontFacing, setIsFrontFacing] = useState(true);

  // Dynamic scale & opacity targets
  const targetScale = isSelected
    ? 1.55
    : hovered
    ? 1.35
    : isCategoryActive
    ? 1.05
    : 0.5;

  const targetOpacity = isCategoryActive
    ? isSelected || hovered
      ? 1.0
      : 0.8
    : 0.2;

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 9
      );

      // Determine if node is currently on the front side facing the camera
      const worldPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPos);
      worldPos.project(state.camera);
      // In normalized device coords, z < 0.95 means in front of globe center
      setIsFrontFacing(worldPos.z < 0.96);
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isSelected ? 2.5 : hovered ? 1.8 : 0.8);
    }
  });

  // Only show HTML label if node is selected, hovered, or in front & active
  const showLabel =
    (isSelected || hovered || isCategoryActive) && isFrontFacing;

  return (
    <group position={tech.position}>
      {/* 3D Core Sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(tech);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.1, 24, 24]} />
        <meshStandardMaterial
          color={tech.color}
          emissive={tech.color}
          emissiveIntensity={isSelected ? 4.0 : hovered ? 3.0 : isCategoryActive ? 1.6 : 0.4}
          roughness={0.15}
          metalness={0.85}
          transparent
          opacity={targetOpacity}
        />
      </mesh>

      {/* Outer Orbit Halo Ring */}
      {(isSelected || hovered || isCategoryActive) && (
        <mesh ref={ringRef}>
          <ringGeometry args={[0.14, 0.17, 32]} />
          <meshBasicMaterial
            color={tech.color}
            transparent
            opacity={isSelected ? 0.9 : hovered ? 0.75 : 0.35}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Contextual Smart Label */}
      {showLabel && (
        <Html
          distanceFactor={7.5}
          center
          position={[0, 0.22, 0]}
          style={{
            pointerEvents: "none",
            transition: "opacity 0.2s ease, transform 0.2s ease",
            opacity: isFrontFacing ? 1 : 0.3,
          }}
        >
          <div
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold tracking-wide whitespace-nowrap transition-all duration-200 select-none shadow-xl ${
              isSelected
                ? "bg-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(0,240,255,0.8)] scale-110 ring-2 ring-white"
                : hovered
                ? "bg-slate-900/95 text-cyan-300 border border-cyan-400/60 shadow-lg scale-105"
                : "bg-slate-950/85 text-slate-200 border border-white/10 backdrop-blur-md"
            }`}
          >
            {tech.name}
          </div>
        </Html>
      )}
    </group>
  );
}
