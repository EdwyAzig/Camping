"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, ScanBarcode, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { ProductThumb } from "@/components/shopping/ProductThumb";
import type { OffProduct } from "@/lib/open-food-facts";
import { calcLineTotal, parseQuantityCount } from "@/lib/shopping-utils";
import { formatEuro, cn } from "@/lib/utils";
import type { ShoppingCategory, ShoppingItem } from "@/lib/types";

const categories: { value: ShoppingCategory; label: string }[] = [
  { value: "cibo", label: "Cibo" },
  { value: "bevande", label: "Bevande" },
  { value: "altro", label: "Altro" },
];

function QtyStepper({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const n = parseQuantityCount(value);
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(String(Math.max(1, n - 1)))}
        className="w-10 h-10 rounded-xl bg-white/5 border border-glass-border flex items-center justify-center text-cream/70 hover:bg-white/10"
      >
        <Minus className="w-4 h-4" />
      </button>
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-center text-lg font-semibold py-2"
      />
      <button
        type="button"
        onClick={() => onChange(String(n + 1))}
        className="w-10 h-10 rounded-xl bg-white/5 border border-glass-border flex items-center justify-center text-cream/70 hover:bg-white/10"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ScannedProductConfirm({
  product,
  existing,
  onConfirm,
  onScanAgain,
  onCancel,
}: {
  product: OffProduct;
  existing: ShoppingItem | null;
  onConfirm: (data: {
    name: string;
    category: ShoppingCategory;
    foodType: string;
    quantity: string;
    unitPrice: string;
    incrementExisting: boolean;
  }) => void | Promise<void>;
  onScanAgain: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [foodType, setFoodType] = useState(product.foodType ?? "");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [increment, setIncrement] = useState(true);

  useEffect(() => {
    setName(product.name);
    setCategory(product.category);
    setFoodType(product.foodType ?? "");
    setQuantity("1");
    setUnitPrice("");
    setIncrement(true);
  }, [product]);

  const qty = parseQuantityCount(quantity);
  const unit = unitPrice ? parseFloat(unitPrice) : null;
  const total = calcLineTotal(qty, unit);
  const notFound = product.found === false || (!product.name && !product.imageUrl);

  return (
    <div className="fixed inset-0 z-[110] bg-night/95 backdrop-blur-md flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-glass-border/60">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-cream/40">Open Food Facts</p>
          <h2 className="font-[family-name:var(--font-fraunces)] text-lg text-cream">Conferma prodotto</h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl bg-white/5 text-cream/60 hover:text-cream"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 pt-4 pb-28 max-w-lg mx-auto w-full space-y-5">
          {notFound ? (
            <div className="rounded-xl bg-amber-950/50 border border-amber-700/40 px-4 py-3 text-sm text-amber-100">
              Prodotto non in database — inserisci il nome manualmente.
              <span className="block text-xs text-amber-200/60 mt-1 font-mono">{product.barcode}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-green-300/90">
              <Sparkles className="w-3.5 h-3.5" />
              Dati riconosciuti automaticamente
            </div>
          )}

          <div className="rounded-2xl overflow-hidden border border-glass-border bg-night/60">
            <ProductThumb src={product.imageUrl} alt={name || "Prodotto"} size="hero" />
            <div className="p-4 space-y-1">
              <h3 className="font-[family-name:var(--font-fraunces)] text-xl text-cream leading-snug">
                {name || product.name || "Nuovo prodotto"}
              </h3>
              {product.brand && <p className="text-sm text-cream/55">{product.brand}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                {product.packSize && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-cream/50">{product.packSize}</span>
                )}
                {foodType && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-ember/10 text-ember">{foodType}</span>
                )}
              </div>
            </div>
          </div>

          {existing && (
            <div className="rounded-xl bg-amber-900/20 border border-amber-700/30 px-4 py-3 text-sm text-amber-100">
              Già in lista ({parseQuantityCount(existing.quantity)}×)
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={increment} onChange={(e) => setIncrement(e.target.checked)} className="rounded accent-ember" />
                Aggiungi alla quantità esistente
              </label>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label>Nome prodotto</Label>
              <Textarea
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome del prodotto"
                rows={2}
                className="min-h-[72px] text-base leading-snug resize-none"
                autoFocus={notFound}
              />
            </div>

            <div>
              <Label className="mb-2">Categoria</Label>
              <div className="flex gap-2">
                {categories.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all",
                      category === c.value
                        ? "bg-ember/15 border-ember/40 text-ember"
                        : "bg-white/5 border-glass-border text-cream/55"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Tipo (opzionale)</Label>
              <Input value={foodType} onChange={(e) => setFoodType(e.target.value)} placeholder="Snack, latticini…" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Quantità</Label>
                <QtyStepper value={quantity} onChange={setQuantity} />
              </div>
              <div>
                <Label>Prezzo cad. €</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.00"
                  className="text-lg py-3 mt-1"
                />
              </div>
            </div>

            {total != null && total > 0 && (
              <div className="rounded-xl bg-ember/10 border border-ember/25 px-4 py-3 flex justify-between items-center">
                <span className="text-sm text-cream/60">Totale riga</span>
                <span className="text-xl font-[family-name:var(--font-fraunces)] text-ember">{formatEuro(total)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-glass-border bg-night/95 px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
        <Button
          type="button"
          size="lg"
          className="w-full max-w-lg mx-auto"
          onClick={() =>
            onConfirm({
              name: name.trim() || product.name,
              category,
              foodType,
              quantity,
              unitPrice,
              incrementExisting: !!existing && increment,
            })
          }
          disabled={!name.trim() && !product.name.trim() && !existing}
        >
          <Plus className="w-5 h-5" />
          {existing && increment ? "Aggiorna quantità" : "Aggiungi alla lista"}
        </Button>
        <button
          type="button"
          onClick={onScanAgain}
          className="w-full py-2 text-sm text-cream/45 hover:text-cream flex items-center justify-center gap-1.5"
        >
          <ScanBarcode className="w-4 h-4" /> Scansiona un altro
        </button>
      </div>
    </div>
  );
}