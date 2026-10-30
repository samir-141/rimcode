"use client";

import React from "react";
import { DemoRole } from "@/types";
import { demoRolePermissions } from "@/data/demo";
import { Shield, UserCheck, Package, Info, RotateCcw } from "lucide-react";

interface Props {
  currentRole: DemoRole;
  onRoleChange: (role: DemoRole) => void;
  onReset?: () => void;
  canReset?: boolean;
}

export function RoleSwitcher({
  currentRole,
  onRoleChange,
  onReset,
  canReset = true,
}: Props) {
  const roles: {
    role: DemoRole;
    shortLabel: string;
    fullLabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      role: "admin",
      shortLabel: "Admin",
      fullLabel: "Administrador",
      icon: <Shield className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      role: "cajero",
      shortLabel: "Cajero",
      fullLabel: "Cajero (POS)",
      icon: <UserCheck className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      role: "almacen",
      shortLabel: "Almacén",
      fullLabel: "Jefe Almacén",
      icon: <Package className="w-3.5 h-3.5 text-violet-400" />,
    },
  ];

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-lg space-y-3">
      {/* Top Bar: Title + Reset Action */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Rol en Simulación
          </span>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={!canReset}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all shadow-sm active:scale-95 shrink-0 ${
              !canReset
                ? "opacity-50 cursor-not-allowed bg-slate-900/50 text-slate-500 border border-white/5"
                : "text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/30"
            }`}
            title={
              !canReset
                ? "Solo el rol Administrador puede reiniciar los datos simulados"
                : "Restablecer datos iniciales de la simulación"
            }
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Restablecer</span>
          </button>
        )}
      </div>

      {/* Role Selector Segmented Grid (Fully responsive, equal width on all devices) */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-white/5 w-full">
        {roles.map(({ role, shortLabel, fullLabel, icon }) => {
          const isActive = currentRole === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => onRoleChange(role)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-slate-800 text-white shadow-md border border-cyan-400/30 text-cyan-300"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
              aria-pressed={isActive}
            >
              <span className="shrink-0">{icon}</span>
              <span className="hidden sm:inline">{fullLabel}</span>
              <span className="sm:hidden">{shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Active Role Permissions Description */}
      <div className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/60 p-2.5 sm:px-3 sm:py-2 rounded-xl border border-white/5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          {demoRolePermissions[currentRole].description}
        </span>
      </div>
    </div>
  );
}
