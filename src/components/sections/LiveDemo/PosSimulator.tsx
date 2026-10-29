"use client";

import { useState, useEffect } from "react";
import { DemoProduct } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { X, ShoppingBag, PlusCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SellModalProps {
  product: DemoProduct | null;
  onClose: () => void;
  onConfirmSale: (productId: string, quantity: number) => void;
}

export function SellModal({ product, onClose, onConfirmSale }: SellModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuantity(1);
    setError(null);
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const total = Number((product.price * quantity).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      setError("La cantidad debe ser un número entero mayor a 0.");
      return;
    }
    if (quantity > product.stock) {
      setError(
        `Existencias insuficientes. Stock actual: ${product.stock} unidades.`
      );
      return;
    }
    onConfirmSale(product.id, quantity);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sell-modal-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-cyan-400 mb-4">
          <ShoppingBag className="w-5 h-5" />
          <h3 id="sell-modal-title" className="text-lg font-bold text-white">
            Registrar Venta POS
          </h3>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 mb-5 space-y-1">
          <p className="font-semibold text-white">{product.name}</p>
          <p className="text-xs text-slate-400">{product.genericName}</p>
          <div className="flex justify-between items-center pt-2 text-xs font-mono">
            <span className="text-slate-400">Precio Unitario:</span>
            <span className="text-cyan-400 font-bold">
              {formatCurrency(product.price)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Stock Disponible:</span>
            <span className="text-emerald-400 font-bold">{product.stock} un.</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="sell-quantity"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Cantidad a vender:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700"
              >
                -
              </button>
              <input
                id="sell-quantity"
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => {
                  setError(null);
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1));
                }}
                className="flex-1 text-center py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono"
              />
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
                className="w-10 h-10 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700"
              >
                +
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex justify-between items-center font-mono">
            <span className="text-xs text-slate-300">Total a Cobrar:</span>
            <span className="text-lg font-bold text-cyan-400">
              {formatCurrency(total)}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-1/2"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-1/2"
              disabled={product.stock <= 0}
            >
              Completar Venta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RestockModalProps {
  product: DemoProduct | null;
  onClose: () => void;
  onConfirmRestock: (productId: string, quantity: number, reason: string) => void;
}

export function RestockModal({
  product,
  onClose,
  onConfirmRestock,
}: RestockModalProps) {
  const [quantity, setQuantity] = useState(10);
  const [reason, setReason] = useState("Reabastecimiento regular de almacén");

  useEffect(() => {
    setQuantity(10);
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;
    onConfirmRestock(product.id, quantity, reason);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restock-modal-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-violet-400 mb-4">
          <PlusCircle className="w-5 h-5" />
          <h3 id="restock-modal-title" className="text-lg font-bold text-white">
            Ingreso a Almacén / Kardex
          </h3>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 mb-5 space-y-1">
          <p className="font-semibold text-white">{product.name}</p>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Existencias actuales:</span>
            <span className="text-white font-bold">{product.stock} un.</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Stock Mínimo configurado:</span>
            <span className="text-amber-400">{product.minStock} un.</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="restock-quantity"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Unidades recibidas:
            </label>
            <input
              id="restock-quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-violet-400 font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="restock-reason"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Motivo u orden de compra:
            </label>
            <input
              id="restock-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-violet-950/30 border border-violet-500/20 flex justify-between items-center font-mono text-xs">
            <span className="text-slate-300">Nuevo stock resultante:</span>
            <span className="text-base font-bold text-violet-300">
              {product.stock + quantity} unidades
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-1/2"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
            >
              Registrar Entrada
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

