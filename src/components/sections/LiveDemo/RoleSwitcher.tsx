"use client";

import { DemoRole } from "@/types";
import { demoRolePermissions } from "@/data/demo";
import { Shield, UserCheck, Package, Info } from "lucide-react";

interface Props {
  currentRole: DemoRole;
  onRoleChange: (role: DemoRole) => void;
}

export function RoleSwitcher({ currentRole, onRoleChange }: Props) {
  const roles: { role: DemoRole; icon: React.ReactNode }[] = [
    {
      role: "admin",
      icon: <Shield className="w-4 h-4 text-cyan-400" />,
    },
    {
      role: "cajero",
      icon: <UserCheck className="w-4 h-4 text-emerald-400" />,
    },
    {
      role: "almacen",
      icon: <Package className="w-4 h-4 text-violet-400" />,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Rol en Demo:
          </span>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-white/5">
            {roles.map(({ role, icon }) => {
              const isActive = currentRole === role;
              const meta = demoRolePermissions[role];
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => onRoleChange(role)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-800 text-white shadow-md border border-white/10"
                      : "text-slate-400 hover:text-white"
                  }`}
                  aria-pressed={isActive}
                >
                  {icon}
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/5">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{demoRolePermissions[currentRole].description}</span>
        </div>
      </div>
    </div>
  );
}

