"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import Image from "next/image";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, RoundedBox, Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// Digital Voice Mouth Visualizer on the dark visor
function DigitalMouth({ isSpeaking }: { isSpeaking: boolean }) {
  const barsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (barsRef.current) {
      barsRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && child.userData.isBar) {
          if (isSpeaking) {
            // Dynamic soundwave modulation when robot greets / speaks
            const freq = Math.sin(t * 16 + i * 1.8);
            child.scale.y = THREE.MathUtils.lerp(
              child.scale.y,
              0.5 + Math.abs(freq) * 2.4,
              0.35
            );
          } else {
            // Friendly cyber smile equalizer curve
            const curve = Math.sin((i / 6) * Math.PI) * 0.4 + 0.6;
            child.scale.y = THREE.MathUtils.lerp(child.scale.y, curve, 0.1);
          }
        }
      });
    }
  });

  // 7 LED bars curved slightly in an upward welcoming smile
  const barDefs = [
    { x: -0.21, y: 0.016, color: "#00ffff" },
    { x: -0.14, y: 0.007, color: "#22d3ee" },
    { x: -0.07, y: 0.002, color: "#38bdf8" },
    { x: 0.0, y: 0.0, color: "#818cf8" },
    { x: 0.07, y: 0.002, color: "#c084fc" },
    { x: 0.14, y: 0.007, color: "#e879f9" },
    { x: 0.21, y: 0.016, color: "#d946ef" },
  ];

  return (
    <group ref={barsRef} position={[0, 0.05, 0.82]}>
      {/* Subtle luminous smile baseline glow */}
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[0.46, 0.014]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.65}
          toneMapped={false}
        />
      </mesh>

      {barDefs.map((def, idx) => (
        <mesh
          key={idx}
          position={[def.x, def.y, 0]}
          userData={{ isBar: true }}
        >
          <boxGeometry args={[0.038, 0.045, 0.015]} />
          <meshBasicMaterial color={def.color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// Interactive Robot Model with high-gloss chrome, dual neon eyes, and bot-like greeting animation
function CyberRobotModel({
  isHovered,
  isGreeting,
  onRobotClick,
  onHoverChange,
}: {
  isHovered: boolean;
  isGreeting: boolean;
  onRobotClick: () => void;
  onHoverChange: (hovered: boolean) => void;
}) {
  const headRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftHandRef = useRef<THREE.Group>(null);
  const rightHandRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  const prevGreetingRef = useRef(false);
  const greetStartClockRef = useRef(-10);

  // High-gloss Automotive Physical Chrome Material (Titanium Silver with clearcoat)
  const chromeMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#6b7d99",
        metalness: 0.92,
        roughness: 0.14,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 0.95,
      }),
    []
  );

  const darkArmorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0b0f19",
        metalness: 0.88,
        roughness: 0.28,
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const { x, y } = state.pointer;

    // Detect greeting transition from idle -> greeting
    if (isGreeting && !prevGreetingRef.current) {
      greetStartClockRef.current = t;
    }
    prevGreetingRef.current = isGreeting;

    const greetElapsed = t - greetStartClockRef.current;
    const inGreet = isGreeting && greetElapsed >= 0 && greetElapsed < 3.4;

    // ================= 1. HEAD & GAZE KINEMATICS (ROBOT BEHAVIOR) =================
    if (headRef.current) {
      if (inGreet) {
        if (greetElapsed < 0.6) {
          // Phase 1: Attention snap & polite robotic nod
          const p = greetElapsed / 0.6;
          const nodDown = Math.sin(p * Math.PI) * 0.22;
          headRef.current.rotation.x = THREE.MathUtils.lerp(
            headRef.current.rotation.x,
            nodDown,
            0.25
          );
          headRef.current.rotation.y = THREE.MathUtils.lerp(
            headRef.current.rotation.y,
            0,
            0.25
          );
          headRef.current.rotation.z = THREE.MathUtils.lerp(
            headRef.current.rotation.z,
            0.08,
            0.2
          );
        } else if (greetElapsed < 2.6) {
          // Phase 2: Active Robot Salute - inquisitive head tilt & rhythmic mechanical nod
          const cycle = greetElapsed - 0.6;
          const nod = Math.sin(cycle * 6.5) * 0.08 - 0.05;
          const tilt = Math.sin(cycle * 3) * 0.09 + 0.04;
          headRef.current.rotation.x = THREE.MathUtils.lerp(
            headRef.current.rotation.x,
            nod - y * 0.15,
            0.15
          );
          headRef.current.rotation.y = THREE.MathUtils.lerp(
            headRef.current.rotation.y,
            x * 0.25,
            0.15
          );
          headRef.current.rotation.z = THREE.MathUtils.lerp(
            headRef.current.rotation.z,
            tilt,
            0.15
          );
        } else {
          // Phase 3: Transition smoothly back to idle cursor tracking
          headRef.current.rotation.y = THREE.MathUtils.lerp(
            headRef.current.rotation.y,
            x * 0.65,
            0.08
          );
          headRef.current.rotation.x = THREE.MathUtils.lerp(
            headRef.current.rotation.x,
            -y * 0.45,
            0.08
          );
          headRef.current.rotation.z = THREE.MathUtils.lerp(
            headRef.current.rotation.z,
            0,
            0.1
          );
        }
      } else {
        // Normal interactive cursor tracking
        headRef.current.rotation.y = THREE.MathUtils.lerp(
          headRef.current.rotation.y,
          x * 0.65,
          0.08
        );
        headRef.current.rotation.x = THREE.MathUtils.lerp(
          headRef.current.rotation.x,
          -y * 0.45,
          0.08
        );
        headRef.current.rotation.z = THREE.MathUtils.lerp(
          headRef.current.rotation.z,
          0,
          0.05
        );
      }
    }

    // ================= 2. TORSO & CORE DYNAMICS =================
    if (bodyRef.current) {
      if (inGreet && greetElapsed < 0.6) {
        // Slight respectful mechanical bow
        const bow = Math.sin((greetElapsed / 0.6) * Math.PI) * 0.09;
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(
          bodyRef.current.rotation.x,
          bow,
          0.15
        );
        bodyRef.current.rotation.y = THREE.MathUtils.lerp(
          bodyRef.current.rotation.y,
          0,
          0.15
        );
      } else {
        bodyRef.current.rotation.y = THREE.MathUtils.lerp(
          bodyRef.current.rotation.y,
          x * 0.28,
          0.05
        );
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(
          bodyRef.current.rotation.x,
          -y * 0.16,
          0.05
        );
      }
    }

    // Power reactor core energy pulse during greeting
    if (coreRef.current) {
      if (inGreet) {
        const pulse = 1.0 + Math.sin(t * 12) * 0.18;
        coreRef.current.scale.set(pulse, pulse, pulse);
      } else {
        coreRef.current.scale.set(1, 1, 1);
      }
    }

    // ================= 3. ROBOTIC ARM GESTURES & SERVO WAVE =================
    if (rightHandRef.current && leftHandRef.current) {
      if (inGreet) {
        if (greetElapsed < 0.6) {
          // Step 1: Arm ascends mechanically to salute height
          const p = greetElapsed / 0.6;
          const easeLift = p * p * (3 - 2 * p); // smoothstep
          const targetY = THREE.MathUtils.lerp(-0.4, 0.42, easeLift);
          const targetX = THREE.MathUtils.lerp(1.25, 1.08, easeLift);
          const targetZ = THREE.MathUtils.lerp(0.3, 0.65, easeLift);
          const targetRotZ = THREE.MathUtils.lerp(0, -0.45, easeLift);

          rightHandRef.current.position.set(targetX, targetY, targetZ);
          rightHandRef.current.rotation.set(0, 0, targetRotZ);
        } else if (greetElapsed < 2.6) {
          // Step 2: Mechanical Articulated Wave with micro-servo vibrations
          const waveCycle = (greetElapsed - 0.6) * 11;
          const waveAngle = Math.sin(waveCycle) * 0.38;
          const servoSnap = Math.sin(waveCycle * 3.5) * 0.035;

          rightHandRef.current.position.y = 0.42 + Math.abs(waveAngle) * 0.04;
          rightHandRef.current.position.x = 1.08;
          rightHandRef.current.position.z = 0.65;

          rightHandRef.current.rotation.z = -0.45 + waveAngle + servoSnap;
          rightHandRef.current.rotation.y = waveAngle * 0.45;
          rightHandRef.current.rotation.x = Math.sin(waveCycle * 0.5) * 0.12;
        } else {
          // Step 3: Arm descends mechanically back to resting float
          const p = (greetElapsed - 2.6) / 0.8;
          const easeDown = THREE.MathUtils.clamp(p, 0, 1);
          const targetY = THREE.MathUtils.lerp(
            0.42,
            Math.cos(t * 2) * 0.12 - 0.4 - y * 0.12,
            easeDown
          );
          const targetX = THREE.MathUtils.lerp(1.08, 1.25, easeDown);
          const targetZ = THREE.MathUtils.lerp(0.65, 0.3, easeDown);
          const targetRotZ = THREE.MathUtils.lerp(-0.45, 0, easeDown);

          rightHandRef.current.position.set(targetX, targetY, targetZ);
          rightHandRef.current.rotation.set(0, 0, targetRotZ);
        }

        // Left hand stabilizes dynamically during salute
        leftHandRef.current.position.y = -0.45 + Math.sin(t * 2) * 0.06;
        leftHandRef.current.rotation.z = 0.15;
      } else {
        // Normal breathing float with mouse reaction
        rightHandRef.current.position.y =
          Math.cos(t * 2) * 0.12 - 0.4 - y * 0.12;
        rightHandRef.current.position.x = 1.25;
        rightHandRef.current.position.z = 0.3;
        rightHandRef.current.rotation.z = THREE.MathUtils.lerp(
          rightHandRef.current.rotation.z,
          0,
          0.08
        );
        rightHandRef.current.rotation.y = THREE.MathUtils.lerp(
          rightHandRef.current.rotation.y,
          0,
          0.08
        );
        rightHandRef.current.rotation.x = THREE.MathUtils.lerp(
          rightHandRef.current.rotation.x,
          0,
          0.08
        );

        leftHandRef.current.position.y =
          Math.sin(t * 2) * 0.12 - 0.4 + y * 0.12;
        leftHandRef.current.position.x = -1.25;
        leftHandRef.current.position.z = 0.3;
        leftHandRef.current.rotation.z = THREE.MathUtils.lerp(
          leftHandRef.current.rotation.z,
          0,
          0.08
        );
      }
    }

    // ================= 4. ORBITAL RINGS SURGE =================
    if (ring1Ref.current && ring2Ref.current) {
      const speedMultiplier = inGreet ? 2.2 : 1.0;
      ring1Ref.current.rotation.z += 0.005 * speedMultiplier;
      ring2Ref.current.rotation.y -= 0.006 * speedMultiplier;
    }

    // ================= 5. EYE BLINK & NEON SURGE =================
    if (leftEyeRef.current && rightEyeRef.current) {
      if (inGreet) {
        let eyeScaleY = 1.0;
        if (
          (greetElapsed > 0.12 && greetElapsed < 0.22) ||
          (greetElapsed > 0.34 && greetElapsed < 0.44)
        ) {
          // Robotic double blink at startup
          eyeScaleY = 0.1;
        } else if (greetElapsed >= 0.6 && greetElapsed < 2.6) {
          // Alert wide-open neon glow during active salute
          eyeScaleY = 1.15;
        }
        leftEyeRef.current.scale.y = eyeScaleY;
        rightEyeRef.current.scale.y = eyeScaleY;
      } else {
        // Idle blink every 4 seconds
        const blinkCycle = t % 4;
        const isBlinking = blinkCycle > 3.85 && blinkCycle < 3.98;
        const eyeScaleY = isBlinking ? 0.1 : 1.0;
        leftEyeRef.current.scale.y = eyeScaleY;
        rightEyeRef.current.scale.y = eyeScaleY;
      }
    }
  });

  return (
    <group
      scale={isHovered ? 1.04 : 1.0}
      onClick={(e) => {
        e.stopPropagation();
        onRobotClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHoverChange(true);
      }}
      onPointerOut={() => {
        onHoverChange(false);
      }}
    >
      <Float speed={2.5} rotationIntensity={0.15} floatIntensity={0.35}>
        {/* ==================== HEAD ==================== */}
        <group ref={headRef} position={[0, 1.15, 0]}>
          {/* Polished Titanium Chrome Skull Helmet */}
          <mesh material={chromeMaterial}>
            <sphereGeometry args={[0.85, 64, 64]} />
          </mesh>

          {/* Forehead Ridge Plate */}
          <RoundedBox
            args={[0.68, 0.16, 0.35]}
            position={[0, 0.48, 0.48]}
            radius={0.06}
            material={darkArmorMaterial}
          />

          {/* Sunken Visor Mask Screen (Elevated to Upper-Face Level) */}
          <RoundedBox
            args={[1.18, 0.5, 0.52]}
            position={[0, 0.18, 0.55]}
            radius={0.18}
            material={darkArmorMaterial}
          />

          {/* Glass Visor Shield */}
          <mesh position={[0, 0.18, 0.8]}>
            <planeGeometry args={[1.05, 0.42]} />
            <meshStandardMaterial
              color="#020617"
              roughness={0.05}
              metalness={0.98}
            />
          </mesh>

          {/* === LEFT EYE: NEON CYAN SQUIRCLE WITH RING & CORE (ELEVATED) === */}
          <group position={[-0.28, 0.24, 0.81]}>
            {/* Outer Cyan Glow Ring */}
            <mesh ref={leftEyeRef}>
              <ringGeometry args={[0.09, 0.155, 32]} />
              <meshBasicMaterial color="#00ffff" toneMapped={false} />
            </mesh>
            {/* Inner Pupil Glow Dot */}
            <mesh position={[0, 0, 0.01]}>
              <sphereGeometry args={[0.048, 16, 16]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
            {/* Cyber Brow Accent */}
            <mesh position={[0, 0.18, 0.005]}>
              <boxGeometry args={[0.22, 0.022, 0.01]} />
              <meshBasicMaterial
                color="#00ffff"
                toneMapped={false}
                transparent
                opacity={0.85}
              />
            </mesh>
          </group>

          {/* === RIGHT EYE: NEON MAGENTA / VIOLET SQUIRCLE WITH RING & CORE (ELEVATED) === */}
          <group position={[0.28, 0.24, 0.81]}>
            {/* Outer Violet Glow Ring */}
            <mesh ref={rightEyeRef}>
              <ringGeometry args={[0.09, 0.155, 32]} />
              <meshBasicMaterial color="#d946ef" toneMapped={false} />
            </mesh>
            {/* Inner Pupil Glow Dot */}
            <mesh position={[0, 0, 0.01]}>
              <sphereGeometry args={[0.048, 16, 16]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
            {/* Cyber Brow Accent */}
            <mesh position={[0, 0.18, 0.005]}>
              <boxGeometry args={[0.22, 0.022, 0.01]} />
              <meshBasicMaterial
                color="#d946ef"
                toneMapped={false}
                transparent
                opacity={0.85}
              />
            </mesh>
          </group>

          {/* === DIGITAL VOICE MOUTH / EQUALIZER SMILE === */}
          <DigitalMouth isSpeaking={isGreeting} />

          {/* Ears / Side Audio Headphones with Neon Rings (Elevated to Eye Line) */}
          {/* Left Ear */}
          <group position={[-0.92, 0.18, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={darkArmorMaterial}>
              <cylinderGeometry args={[0.22, 0.22, 0.2, 32]} />
            </mesh>
            <mesh position={[-0.12, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.2, 0.035, 16, 32]} />
              <meshBasicMaterial color="#00ffff" toneMapped={false} />
            </mesh>
          </group>

          {/* Right Ear */}
          <group position={[0.92, 0.18, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={darkArmorMaterial}>
              <cylinderGeometry args={[0.22, 0.22, 0.2, 32]} />
            </mesh>
            <mesh position={[0.12, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.2, 0.035, 16, 32]} />
              <meshBasicMaterial color="#00ffff" toneMapped={false} />
            </mesh>
          </group>
        </group>

        {/* ==================== TORSO ==================== */}
        <group ref={bodyRef} position={[0, -0.35, 0]}>
          {/* Main Chrome Chassis */}
          <mesh material={chromeMaterial}>
            <cylinderGeometry args={[0.68, 0.45, 1.35, 32]} />
          </mesh>

          {/* Articulated Neck Ring */}
          <mesh position={[0, 0.75, 0]} material={darkArmorMaterial}>
            <cylinderGeometry args={[0.28, 0.35, 0.25, 32]} />
          </mesh>

          {/* Chest Power Reactor Core */}
          <mesh ref={coreRef} position={[0, 0.1, 0.58]}>
            <sphereGeometry args={[0.22, 32, 32]} />
            <meshBasicMaterial color="#00ffff" toneMapped={false} />
          </mesh>

          {/* Concentric Energy Halo */}
          <mesh position={[0, 0.1, 0.56]}>
            <ringGeometry args={[0.24, 0.32, 32]} />
            <meshBasicMaterial
              color="#8b5cf6"
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* ==================== HANDS & ENERGY ORBS ==================== */}
        {/* Left Hand holding Cyan Celestial Orb */}
        <group ref={leftHandRef} position={[-1.25, -0.4, 0.3]}>
          <mesh material={chromeMaterial}>
            <sphereGeometry args={[0.26, 32, 32]} />
          </mesh>
          {/* Cyan Floating Energy Sphere */}
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshBasicMaterial color="#00ffff" toneMapped={false} />
          </mesh>
          {/* Planetary Ring */}
          <mesh rotation={[Math.PI / 3, 0, 0]} position={[0, 0.15, 0]}>
            <torusGeometry args={[0.38, 0.016, 16, 64]} />
            <meshBasicMaterial color="#00ffff" toneMapped={false} />
          </mesh>
        </group>

        {/* Right Hand holding Magenta Celestial Orb */}
        <group ref={rightHandRef} position={[1.25, -0.4, 0.3]}>
          <mesh material={chromeMaterial}>
            <sphereGeometry args={[0.26, 32, 32]} />
          </mesh>
          {/* Magenta Floating Energy Sphere */}
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshBasicMaterial color="#d946ef" toneMapped={false} />
          </mesh>
          {/* Planetary Ring */}
          <mesh rotation={[-Math.PI / 3, 0, 0]} position={[0, 0.15, 0]}>
            <torusGeometry args={[0.38, 0.016, 16, 64]} />
            <meshBasicMaterial color="#d946ef" toneMapped={false} />
          </mesh>
        </group>
      </Float>

      {/* ==================== ORBITAL COSMIC RINGS ==================== */}
      {/* Violet Orbital Ring with Satellite */}
      <group ref={ring1Ref} rotation={[Math.PI / 2.3, 0.2, 0]}>
        <mesh>
          <torusGeometry args={[2.3, 0.025, 16, 100]} />
          <meshBasicMaterial color="#a855f7" toneMapped={false} />
        </mesh>
        {/* Orbiting Satellite */}
        <mesh position={[2.3, 0, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshBasicMaterial color="#f0abfc" toneMapped={false} />
        </mesh>
      </group>

      {/* Cyan Orbital Ring with Satellite */}
      <group ref={ring2Ref} rotation={[0.4, Math.PI / 5, -0.3]}>
        <mesh>
          <torusGeometry args={[2.0, 0.025, 16, 100]} />
          <meshBasicMaterial color="#00ffff" toneMapped={false} />
        </mesh>
        {/* Orbiting Satellite */}
        <mesh position={[-2.0, 0, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#67e8f9" toneMapped={false} />
        </mesh>
      </group>

      {/* Floating Data Sparkles */}
      <Sparkles count={75} scale={5.2} size={2.5} speed={0.5} color="#00ffff" />
      <Sparkles count={55} scale={5.8} size={3.0} speed={0.3} color="#d946ef" />
    </group>
  );
}

// Fallback visual component for low-power devices, reduced-motion or WebGL errors
export function AvatarStaticFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center relative p-6">
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-slate-950/80 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_60px_rgba(0,240,255,0.25)] overflow-hidden">
        <Image
          src="/images/avatar-robot-hero.jpg"
          alt="Avatar Robot RimCode"
          fill
          sizes="288px"
          className="object-cover rounded-3xl"
        />
      </div>
    </div>
  );
}

export function Avatar3D() {
  const [hasWebGL] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const canvas = document.createElement("canvas");
      return !!(
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")
      );
    } catch {
      return false;
    }
  });

  const [prefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const [isHovered, setIsHovered] = useState(false);
  const [isGreeting, setIsGreeting] = useState(false);

  // Playful high-tech robotic chirp (Web Audio API)
  const playChirpSound = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      const t0 = audioCtx.currentTime;

      // Pleasant high-tech robotic chirp: D5 -> A5 -> F#6 -> D6
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, t0); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, t0 + 0.1); // A5
      osc.frequency.setValueAtTime(1479.98, t0 + 0.15); // F#6
      osc.frequency.exponentialRampToValueAtTime(1174.66, t0 + 0.35); // D6

      gain.gain.setValueAtTime(0.06, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.42);
    } catch {
      // Audio unavailable or autoplay restricted
    }
  }, []);

  const handleTriggerGreet = useCallback(() => {
    setIsGreeting(true);
    playChirpSound();
    setTimeout(() => {
      setIsGreeting(false);
    }, 3400);
  }, [playChirpSound]);

  useEffect(() => {
    // Trigger initial robotic greeting animation upon page load
    const timer = setTimeout(() => {
      handleTriggerGreet();
    }, 600);

    return () => clearTimeout(timer);
  }, [handleTriggerGreet]);

  if (!hasWebGL || prefersReducedMotion) {
    return (
      <div className="w-full h-[480px] sm:h-[550px]">
        <AvatarStaticFallback />
      </div>
    );
  }

  return (
    <div
      className="w-full h-[480px] sm:h-[550px] relative select-none cursor-pointer"
      role="img"
      aria-label="Avatar 3D interactivo de RimCode con animación robótica de saludo"
    >
      {/* ================= THREE.JS CANVAS SCENE ================= */}
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        {/* Physical Lighting with Titanium Chrome Specular Highlights */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[0, 4, 3]} intensity={1.8} color="#e2e8f0" />
        <pointLight position={[3.5, 2.5, 3]} intensity={36} color="#00ffff" />
        <pointLight position={[-3.5, -2, 3]} intensity={36} color="#d946ef" />
        <pointLight position={[0, -3, 2]} intensity={16} color="#38bdf8" />

        {/* Suspense boundary inside Canvas catches Drei loaders without touching React DOM */}
        <Suspense fallback={null}>
          <Environment preset="city" />
          <CyberRobotModel
            isHovered={isHovered}
            isGreeting={isGreeting}
            onRobotClick={handleTriggerGreet}
            onHoverChange={setIsHovered}
          />
        </Suspense>

        {/* Bloom Post-Processing for Glowing Neon Radiance */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.9}
            mipmapBlur
            intensity={1.35}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
