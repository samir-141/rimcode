"use client";

import { useReducer, useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  initialDemoProducts,
  initialDemoSalesHistory,
  initialDemoStockMovements,
  initialDemoHourlySales,
  demoRolePermissions,
} from "@/data/demo";
import {
  DemoProduct,
  DemoRole,
  DemoSaleRecord,
  DemoStockMovement,
  DemoHourlySales,
} from "@/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  DollarSign,
  Package,
  AlertTriangle,
  Receipt,
  Layers,
  History,
  BarChart3,
  ShieldAlert,
} from "lucide-react";
import { RoleSwitcher } from "./LiveDemo/RoleSwitcher";
import { InventoryTable } from "./LiveDemo/InventoryTable";
import { SalesChart } from "./LiveDemo/SalesChart";
import { KardexHistory } from "./LiveDemo/KardexHistory";
import { SellModal, RestockModal } from "./LiveDemo/PosSimulator";

// State definition
interface State {
  products: DemoProduct[];
  salesHistory: DemoSaleRecord[];
  movementHistory: DemoStockMovement[];
  hourlySales: DemoHourlySales[];
  currentRole: DemoRole;
  searchQuery: string;
  selectedCategory: string;
}

type Action =
  | { type: "SET_ROLE"; role: DemoRole }
  | { type: "SET_SEARCH"; query: string }
  | { type: "SET_CATEGORY"; category: string }
  | { type: "PROCESS_SALE"; productId: string; quantity: number }
  | {
      type: "RESTOCK_PRODUCT";
      productId: string;
      quantity: number;
      reason: string;
    }
  | { type: "RESET_ALL" };

function getNowTime(): string {
  const d = new Date();
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function demoReducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ROLE":
      return { ...state, currentRole: action.role };

    case "SET_SEARCH":
      return { ...state, searchQuery: action.query };

    case "SET_CATEGORY":
      return { ...state, selectedCategory: action.category };

    case "PROCESS_SALE": {
      const product = state.products.find((p) => p.id === action.productId);
      if (!product || product.stock < action.quantity) return state;

      const newStock = product.stock - action.quantity;
      const saleTotal = Number((product.price * action.quantity).toFixed(2));
      const timestamp = getNowTime();

      const newSale: DemoSaleRecord = {
        id: `sale-${Date.now().toString().slice(-4)}`,
        productId: product.id,
        productName: product.name,
        quantity: action.quantity,
        unitPrice: product.price,
        total: saleTotal,
        timestamp,
        cashierRole: state.currentRole,
      };

      const newMovement: DemoStockMovement = {
        id: `mov-${Date.now().toString().slice(-4)}`,
        productId: product.id,
        productName: product.name,
        type: "VENTA",
        quantity: action.quantity,
        previousStock: product.stock,
        newStock,
        reason: `Venta POS #${newSale.id} (${action.quantity} ${product.unit})`,
        timestamp,
        userRole: state.currentRole,
      };

      const updatedProducts = state.products.map((p) =>
        p.id === action.productId ? { ...p, stock: newStock } : p
      );

      // Append or update current hourly sales
      const currentHour = `${new Date().getHours().toString().padStart(2, "0")}:00`;
      const existingHourIdx = state.hourlySales.findIndex(
        (h) => h.hour === currentHour
      );
      const updatedHourly = [...state.hourlySales];
      if (existingHourIdx >= 0) {
        updatedHourly[existingHourIdx] = {
          ...updatedHourly[existingHourIdx],
          ventas: Number(
            (updatedHourly[existingHourIdx].ventas + saleTotal).toFixed(2)
          ),
          transacciones: updatedHourly[existingHourIdx].transacciones + 1,
        };
      } else {
        updatedHourly.push({
          hour: currentHour,
          ventas: saleTotal,
          transacciones: 1,
        });
      }

      return {
        ...state,
        products: updatedProducts,
        salesHistory: [newSale, ...state.salesHistory],
        movementHistory: [newMovement, ...state.movementHistory],
        hourlySales: updatedHourly,
      };
    }

    case "RESTOCK_PRODUCT": {
      const product = state.products.find((p) => p.id === action.productId);
      if (!product) return state;

      const newStock = product.stock + action.quantity;
      const timestamp = getNowTime();

      const newMovement: DemoStockMovement = {
        id: `mov-${Date.now().toString().slice(-4)}`,
        productId: product.id,
        productName: product.name,
        type: "REABASTECIMIENTO",
        quantity: action.quantity,
        previousStock: product.stock,
        newStock,
        reason: action.reason || "Reabastecimiento de almacén",
        timestamp,
        userRole: state.currentRole,
      };

      const updatedProducts = state.products.map((p) =>
        p.id === action.productId ? { ...p, stock: newStock } : p
      );

      return {
        ...state,
        products: updatedProducts,
        movementHistory: [newMovement, ...state.movementHistory],
      };
    }

    case "RESET_ALL":
      return {
        products: initialDemoProducts,
        salesHistory: initialDemoSalesHistory,
        movementHistory: initialDemoStockMovements,
        hourlySales: initialDemoHourlySales,
        currentRole: "admin",
        searchQuery: "",
        selectedCategory: "all",
      };

    default:
      return state;
  }
}

export function LiveDemoSection() {
  const [state, dispatch] = useReducer(demoReducer, {
    products: initialDemoProducts,
    salesHistory: initialDemoSalesHistory,
    movementHistory: initialDemoStockMovements,
    hourlySales: initialDemoHourlySales,
    currentRole: "admin",
    searchQuery: "",
    selectedCategory: "all",
  });

  const [activeTab, setActiveTab] = useState<"inventory" | "chart" | "kardex">(
    "inventory"
  );
  const [selectedProductForSell, setSelectedProductForSell] =
    useState<DemoProduct | null>(null);
  const [selectedProductForRestock, setSelectedProductForRestock] =
    useState<DemoProduct | null>(null);

  // Derived metrics
  const totalSalesRevenue = state.salesHistory.reduce(
    (acc, curr) => acc + curr.total,
    0
  );
  const totalTransactions = state.salesHistory.length;
  const lowStockCount = state.products.filter(
    (p) => p.stock <= p.minStock
  ).length;
  const totalStockUnits = state.products.reduce((acc, p) => acc + p.stock, 0);

  const permissions = demoRolePermissions[state.currentRole];

  const handleConfirmSale = (productId: string, quantity: number) => {
    const prod = state.products.find((p) => p.id === productId);
    if (!prod) return;

    if (quantity > prod.stock) {
      toast.error(
        `Operación rechazada: stock insuficiente (${prod.stock} disponibles).`
      );
      return;
    }

    dispatch({ type: "PROCESS_SALE", productId, quantity });
    toast.success(
      `Venta registrada: ${quantity} x ${prod.name} (${formatCurrency(
        prod.price * quantity
      )})`
    );
  };

  const handleConfirmRestock = (
    productId: string,
    quantity: number,
    reason: string
  ) => {
    const prod = state.products.find((p) => p.id === productId);
    if (!prod) return;

    dispatch({ type: "RESTOCK_PRODUCT", productId, quantity, reason });
    toast.success(
      `Reabastecimiento completado: +${quantity} unidades agregadas a ${prod.name}.`
    );
  };

  const handleReset = () => {
    dispatch({ type: "RESET_ALL" });
    toast.info("Demo restablecida con éxito a sus datos iniciales.");
  };

  return (
    <section id="demo-erp" className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute bottom-10 left-1/4 w-[32rem] h-[32rem] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none"
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
            badge="Simulación Interactiva"
            badgeVariant="emerald"
            title="Mini ERP en Vivo"
            highlight="Botica & Control de Stock"
            subtitle="Interactúa en tiempo real con este prototipo funcional: registra ventas, supervisa el kardex de inventario, consulta gráficos de ventas y prueba la simulación de permisos por rol."
          />
        </motion.div>

        {/* Role Switcher and Header Control Bar */}
        <div className="mb-6">
          <RoleSwitcher
            currentRole={state.currentRole}
            onRoleChange={(role) => dispatch({ type: "SET_ROLE", role })}
            onReset={handleReset}
            canReset={permissions.canReset}
          />
        </div>

        {/* KPI Metrics Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {/* Total Revenue */}
          <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Ventas Totales
              </span>
              <DollarSign className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white font-mono">
              {formatCurrency(totalSalesRevenue)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {totalTransactions} transacciones registradas
            </p>
          </div>

          {/* Total Products in Catalog */}
          <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Catálogo Activo
              </span>
              <Package className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white font-mono">
              {state.products.length} productos
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {totalStockUnits} unidades físicas totales
            </p>
          </div>

          {/* Low Stock Alerts */}
          <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Alertas de Stock
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p
              className={`text-xl sm:text-2xl font-bold font-mono ${
                lowStockCount > 0 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {lowStockCount} artículos
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Bajo umbral de stock mínimo
            </p>
          </div>

          {/* Recent Sales Count */}
          <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Movimientos Kardex
              </span>
              <Receipt className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white font-mono">
              {state.movementHistory.length} registros
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Trazabilidad en tiempo real
            </p>
          </div>
        </div>

        {/* Navigation Tabs for Demo Views */}
        <div className="flex items-center gap-2 border-b border-white/10 mb-6 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "inventory"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Inventario & POS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("chart")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "chart"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Gráfico de Ventas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("kardex")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "kardex"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>Kardex Histórico</span>
          </button>
        </div>

        {/* Active Tab View */}
        <div className="min-h-[380px]">
          {activeTab === "inventory" && (
            <InventoryTable
              products={state.products}
              currentRole={state.currentRole}
              searchQuery={state.searchQuery}
              selectedCategory={state.selectedCategory}
              onSearchChange={(q) => dispatch({ type: "SET_SEARCH", query: q })}
              onCategoryChange={(c) =>
                dispatch({ type: "SET_CATEGORY", category: c })
              }
              onOpenSellModal={setSelectedProductForSell}
              onOpenRestockModal={setSelectedProductForRestock}
            />
          )}

          {activeTab === "chart" && (
            <div className="h-[360px]">
              <SalesChart data={state.hourlySales} />
            </div>
          )}

          {activeTab === "kardex" && (
            <KardexHistory movements={state.movementHistory} />
          )}
        </div>

        {/* Disclaimer Note */}
        <div className="mt-8 p-4 rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-md flex items-start gap-3 text-xs text-slate-400">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong>Nota informativa de demostración:</strong> Esta simulación
            se ejecuta íntegramente de manera local en tu navegador con datos de
            ejemplo. No representa asesoría médica, medicamentos reales ni está
            conectada a bases de datos transaccionales de producción. La
            selección de roles simula restricciones de interfaz con propósitos
            demostrativos.
          </p>
        </div>
      </Container>

      {/* Modals for Sell & Restock */}
      <SellModal
        product={selectedProductForSell}
        onClose={() => setSelectedProductForSell(null)}
        onConfirmSale={handleConfirmSale}
      />

      <RestockModal
        product={selectedProductForRestock}
        onClose={() => setSelectedProductForRestock(null)}
        onConfirmRestock={handleConfirmRestock}
      />
    </section>
  );
}

