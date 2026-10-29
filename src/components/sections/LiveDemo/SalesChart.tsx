"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DemoHourlySales } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface Props {
  data: DemoHourlySales[];
}

export function SalesChart({ data }: Props) {
  const totalRevenue = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.ventas, 0);
  }, [data]);

  return (
    <div className="w-full h-full p-5 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Ingresos Estimados por Hora
          </span>
          <p className="text-xl sm:text-2xl font-bold text-white mt-0.5">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Simulación en vivo</span>
        </div>
      </div>

      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis
              dataKey="hour"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              tickFormatter={(val) => `S/${val}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-white/10 bg-slate-950/95 p-3 shadow-xl backdrop-blur-md">
                      <p className="text-xs font-semibold text-slate-400 mb-1">
                        Hora: {label}
                      </p>
                      <p className="text-sm font-bold text-cyan-400">
                        Ventas: {formatCurrency(Number(payload[0].value))}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Transacciones: {payload[0].payload.transacciones}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="ventas"
              stroke="#00f0ff"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorVentas)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

