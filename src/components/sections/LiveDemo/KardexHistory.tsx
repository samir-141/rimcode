"use client";

import { DemoStockMovement } from "@/types";
import { ArrowDownRight, ArrowUpRight, History, SlidersHorizontal } from "lucide-react";

interface Props {
  movements: DemoStockMovement[];
}

export function KardexHistory({ movements }: Props) {
  if (movements.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-white/5">
        <p className="text-sm text-slate-400">No hay movimientos registrados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <History className="w-4 h-4 text-cyan-400" />
          Kardex de Movimientos Recientes
        </h4>
        <span className="text-xs text-slate-500 font-mono">
          {movements.length} eventos registrados
        </span>
      </div>

      <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
        {movements.map((mov) => {
          const isSale = mov.type === "VENTA";
          const isRestock = mov.type === "REABASTECIMIENTO";

          return (
            <div
              key={mov.id}
              className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    isSale
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : isRestock
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}
                >
                  {isSale ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : isRestock ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <SlidersHorizontal className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {mov.productName}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isSale
                          ? "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                          : isRestock
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                          : "bg-blue-950/60 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {mov.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{mov.reason}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-mono">
                <div className="text-right">
                  <span className="text-slate-400">Stock: </span>
                  <span className="text-slate-500 line-through">
                    {mov.previousStock}
                  </span>{" "}
                  →{" "}
                  <span className="font-bold text-white">{mov.newStock}</span>
                </div>
                <div className="text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-white/5">
                  {mov.timestamp} • {mov.userRole}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

