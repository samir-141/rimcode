"use client";

import { DemoProduct, DemoRole } from "@/types";
import { demoRolePermissions } from "@/data/demo";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  ShoppingCart,
  PlusCircle,
  AlertTriangle,
  Filter,
} from "lucide-react";

interface Props {
  products: DemoProduct[];
  currentRole: DemoRole;
  searchQuery: string;
  selectedCategory: string;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onOpenSellModal: (product: DemoProduct) => void;
  onOpenRestockModal: (product: DemoProduct) => void;
}

export function InventoryTable({
  products,
  currentRole,
  searchQuery,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
  onOpenSellModal,
  onOpenRestockModal,
}: Props) {
  const permissions = demoRolePermissions[currentRole];

  const categories = [
    "all",
    "Analgésicos",
    "Antibióticos",
    "Cuidado Personal",
    "Vitaminas",
    "Primeros Auxilios",
  ];

  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      selectedCategory === "all" || prod.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      prod.name.toLowerCase().includes(query) ||
      prod.genericName.toLowerCase().includes(query) ||
      prod.sku.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por producto, principio activo o SKU..."
            aria-label="Buscar productos en inventario"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-slate-900/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 mr-1" />
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-cyan-500 text-slate-950 font-semibold shadow-sm"
                    : "bg-slate-900/60 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                {cat === "all" ? "Todas" : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-white/10 bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3.5">
                  SKU & Medicamento
                </th>
                <th scope="col" className="px-4 py-3.5 hidden md:table-cell">
                  Categoría
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Precio Venta
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Existencias
                </th>
                <th scope="col" className="px-4 py-3.5 hidden lg:table-cell">
                  Vencimiento
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron productos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isLowStock = prod.stock <= prod.minStock;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Name & SKU */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">
                          {prod.name}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span className="font-mono text-cyan-400">
                            {prod.sku}
                          </span>
                          <span>•</span>
                          <span className="italic">{prod.genericName}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 hidden md:table-cell text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-white/5 text-xs">
                          {prod.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5 font-bold text-white font-mono">
                        {formatCurrency(prod.price)}
                      </td>

                      {/* Stock & Warning badge */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              isLowStock ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {prod.stock} {prod.unit}
                          </span>
                          {isLowStock && (
                            <span
                              title={`Stock bajo: mínimo sugerido ${prod.minStock}`}
                              className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Expiration date */}
                      <td className="px-4 py-3.5 hidden lg:table-cell font-mono text-xs text-slate-400">
                        {prod.expirationDate}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Sell Button */}
                          <button
                            type="button"
                            onClick={() => onOpenSellModal(prod)}
                            disabled={!permissions.canSell || prod.stock <= 0}
                            title={
                              !permissions.canSell
                                ? "Tu rol actual no tiene permiso para vender"
                                : prod.stock <= 0
                                ? "Sin existencias disponibles"
                                : "Vender medicamento"
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Vender</span>
                          </button>

                          {/* Restock Button */}
                          <button
                            type="button"
                            onClick={() => onOpenRestockModal(prod)}
                            disabled={!permissions.canRestock}
                            title={
                              !permissions.canRestock
                                ? "Tu rol actual no tiene permiso para reabastecer"
                                : "Reabastecer stock de producto"
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Entrada</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

