"use client";

import { useCallback, useState } from "react";
import { Plus, Flame, ScanBarcode, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/Progress";
import { BarcodeScanner } from "@/components/shopping/BarcodeScanner";
import { ScannedProductConfirm } from "@/components/shopping/ScannedProductConfirm";
import { ShoppingItemCard } from "@/components/shopping/ShoppingItemCard";
import {
  ShoppingItemRow,
  itemToEditState,
  type ItemEditState,
} from "@/components/shopping/ShoppingItemRow";
import { calcShoppingPaid, calcShoppingRemaining } from "@/lib/finance";
import type { OffProduct } from "@/lib/open-food-facts";
import { calcLineTotal, parseQuantityCount } from "@/lib/shopping-utils";
import { formatEuro } from "@/lib/utils";
import type { ShoppingItem, ShoppingCategory, TripMember } from "@/lib/types";

const categories: { value: ShoppingCategory; label: string }[] = [
  { value: "cibo", label: "Cibo" },
  { value: "bevande", label: "Bevande" },
  { value: "altro", label: "Altro" },
];

export function ShoppingList({ tripId, members, initialItems }: {
  tripId: string;
  members: TripMember[];
  initialItems: ShoppingItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ShoppingCategory>("cibo");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [foodType, setFoodType] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<OffProduct | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<ItemEditState | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("shopping_items").select("*").eq("trip_id", tripId).order("created_at");
    if (data) setItems(data as ShoppingItem[]);
  }, [tripId]);

  useRealtimeTable("shopping_items", tripId, load);

  function handleDetected(product: OffProduct) {
    setScannerOpen(false);
    setPendingProduct(product);
  }

  async function confirmScannedProduct(data: {
    name: string;
    category: ShoppingCategory;
    foodType: string;
    quantity: string;
    unitPrice: string;
    incrementExisting: boolean;
  }) {
    if (!pendingProduct) return;
    const supabase = createClient();
    const existing = items.find((i) => i.barcode === pendingProduct.barcode && !i.bought);
    const qty = parseQuantityCount(data.quantity);
    const unit = data.unitPrice ? parseFloat(data.unitPrice) : null;

    if (existing && data.incrementExisting) {
      const newQty = parseQuantityCount(existing.quantity) + qty;
      const useUnit = unit ?? existing.unit_price;
      await supabase.from("shopping_items").update({
        quantity: String(newQty),
        unit_price: useUnit,
        estimated_price: calcLineTotal(newQty, useUnit),
      }).eq("id", existing.id);
    } else {
      await supabase.from("shopping_items").insert({
        trip_id: tripId,
        name: data.name.trim() || pendingProduct.name || `Prodotto ${pendingProduct.barcode}`,
        category: data.category,
        quantity: String(qty),
        unit_price: unit,
        estimated_price: calcLineTotal(qty, unit),
        food_type: data.foodType.trim() || pendingProduct.foodType,
        brand: pendingProduct.brand,
        barcode: pendingProduct.barcode,
        image_url: pendingProduct.imageUrl,
        pack_size: pendingProduct.packSize,
        source: pendingProduct.name ? "openfoodfacts" : "manual",
      });
    }

    setPendingProduct(null);
    await load();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const supabase = createClient();
    const qty = parseQuantityCount(quantity);
    const unit = unitPrice ? parseFloat(unitPrice) : null;
    await supabase.from("shopping_items").insert({
      trip_id: tripId,
      name: name.trim(),
      category,
      quantity: String(qty),
      unit_price: unit,
      estimated_price: calcLineTotal(qty, unit),
      food_type: foodType.trim() || null,
      source: "manual",
    });
    setName("");
    setQuantity("1");
    setUnitPrice("");
    setFoodType("");
    setCategory("cibo");
    load();
  }

  async function toggleBought(item: ShoppingItem) {
    const supabase = createClient();
    const becomingBought = !item.bought;
    const total = item.estimated_price ?? calcLineTotal(item.quantity, item.unit_price);
    if (becomingBought && total != null && item.actual_price == null) {
      await supabase.from("shopping_items").update({ bought: true, actual_price: total }).eq("id", item.id);
    } else {
      await supabase.from("shopping_items").update({ bought: becomingBought }).eq("id", item.id);
    }
    load();
  }

  function startEdit(item: ShoppingItem) {
    setEditingId(item.id);
    setEdit(itemToEditState(item));
  }

  async function saveEdit(item: ShoppingItem) {
    if (!edit) return;
    const supabase = createClient();
    const qty = parseQuantityCount(edit.quantity);
    const unit = edit.unit_price ? parseFloat(edit.unit_price) : null;
    const total = calcLineTotal(qty, unit);
    await supabase.from("shopping_items").update({
      name: edit.name.trim() || item.name,
      food_type: edit.food_type.trim() || null,
      category: edit.category,
      quantity: String(qty),
      unit_price: unit,
      estimated_price: total,
      actual_price: item.bought && edit.actual_price ? parseFloat(edit.actual_price) : item.actual_price,
    }).eq("id", item.id);
    setEditingId(null);
    setEdit(null);
    load();
  }

  async function deleteItem(id: string) {
    const supabase = createClient();
    await supabase.from("shopping_items").delete().eq("id", id);
    if (editingId === id) { setEditingId(null); setEdit(null); }
    load();
  }

  async function assignItem(itemId: string, userId: string) {
    const supabase = createClient();
    await supabase.from("shopping_items").update({ assigned_to: userId || null }).eq("id", itemId);
    load();
  }

  const total = items.reduce((s, i) => {
    const line = i.estimated_price ?? calcLineTotal(i.quantity, i.unit_price) ?? 0;
    if (i.bought) return s + (i.actual_price ?? line);
    return s + line;
  }, 0);
  const paid = calcShoppingPaid(items);
  const remaining = calcShoppingRemaining(items);
  const boughtCount = items.filter((i) => i.bought).length;
  const manualTotal = calcLineTotal(parseQuantityCount(quantity), unitPrice ? parseFloat(unitPrice) : null);
  const pendingExisting = pendingProduct
    ? items.find((i) => i.barcode === pendingProduct.barcode && !i.bought) ?? null
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lista spesa"
        description={`${boughtCount}/${items.length} comprati · Totale ${formatEuro(total)}`}
        icon={Flame}
        badge="Spesa"
      />

      <button
        type="button"
        onClick={() => setScannerOpen(true)}
        className="w-full animate-fade-up group relative overflow-hidden rounded-2xl border border-ember/30 bg-gradient-to-br from-ember/20 via-ember/10 to-transparent p-5 text-left transition-all hover:border-ember/50 active:scale-[0.99]"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-ember/20 flex items-center justify-center shrink-0">
            <ScanBarcode className="w-6 h-6 text-ember" />
          </div>
          <div>
            <p className="font-[family-name:var(--font-fraunces)] text-lg text-cream">Scansiona barcode</p>
            <p className="text-xs text-cream/50 mt-0.5">Nome e foto da Open Food Facts</p>
          </div>
        </div>
      </button>

      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 animate-fade-up">
          <StatCard label="Già pagato" value={formatEuro(paid)} accent />
          <StatCard label="Da pagare" value={formatEuro(remaining)} />
          <StatCard label="Totale lista" value={formatEuro(total)} />
        </div>
      )}

      {items.length > 0 && (
        <div className="animate-fade-up">
          <div className="flex justify-between text-xs text-cream/50 mb-1.5">
            <span>Progresso acquisti</span>
            <span className="text-ember font-medium">{Math.round((boughtCount / items.length) * 100)}%</span>
          </div>
          <div className="progress-track h-2">
            <div className="progress-fill" style={{ width: `${(boughtCount / items.length) * 100}%` }} />
          </div>
        </div>
      )}

      <Card gradient className="animate-fade-up animate-fade-up-delay-1 p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setManualOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-cream/60 hover:text-cream/80"
        >
          <span>Aggiungi manualmente</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${manualOpen ? "rotate-180" : ""}`} />
        </button>
        {manualOpen && (
          <form onSubmit={handleAdd} className="px-4 pb-4 grid sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end border-t border-glass-border/50 pt-4">
            <div className="sm:col-span-2">
              <Label>Prodotto</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acqua, carne..." required />
            </div>
            <div>
              <Label>Tipo</Label>
              <Input value={foodType} onChange={(e) => setFoodType(e.target.value)} placeholder="Pasta..." />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value as ShoppingCategory)}>
                {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </div>
            <div>
              <Label>Qtà × € cad.</Label>
              <div className="flex gap-1">
                <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-14" />
                <Input type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="€" className="flex-1" />
              </div>
              {manualTotal != null && (
                <p className="text-[10px] text-ember mt-0.5">Totale {formatEuro(manualTotal)}</p>
              )}
            </div>
            <Button type="submit" className="w-full sm:w-auto sm:mt-6"><Plus className="w-4 h-4" /> Aggiungi</Button>
          </form>
        )}
      </Card>

      {items.length === 0 ? (
        <Card gradient className="animate-fade-up animate-fade-up-delay-2">
          <div className="text-center py-12 text-cream/50 space-y-2">
            <ScanBarcode className="w-10 h-10 mx-auto text-cream/20" />
            <p>Lista vuota</p>
            <p className="text-xs">Scansiona un prodotto e conferma prima di aggiungerlo</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="md:hidden space-y-3 animate-fade-up animate-fade-up-delay-2">
            {items.map((item) => (
              <ShoppingItemCard
                key={item.id}
                item={item}
                members={members}
                editing={editingId === item.id}
                edit={edit ?? itemToEditState(item)}
                onEdit={() => startEdit(item)}
                onCancel={() => { setEditingId(null); setEdit(null); }}
                onSave={() => saveEdit(item)}
                onDelete={() => deleteItem(item.id)}
                onToggleBought={() => toggleBought(item)}
                onAssign={(uid) => assignItem(item.id, uid)}
                onEditChange={(patch) => setEdit((prev) => ({ ...(prev ?? itemToEditState(item)), ...patch }))}
              />
            ))}
          </div>

          <Card gradient className="hidden md:block p-0 overflow-hidden animate-fade-up animate-fade-up-delay-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-night/40 text-cream/50 border-b border-glass-border">
                    <th className="p-3 w-8"></th>
                    <th className="text-left p-3">Prodotto</th>
                    <th className="text-left p-3">Tipo</th>
                    <th className="text-center p-3">Qtà</th>
                    <th className="text-right p-3">Totale</th>
                    <th className="text-right p-3">Pagato</th>
                    <th className="text-left p-3">Chi</th>
                    <th className="p-3 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      members={members}
                      editing={editingId === item.id}
                      edit={edit ?? itemToEditState(item)}
                      onEdit={() => startEdit(item)}
                      onCancel={() => { setEditingId(null); setEdit(null); }}
                      onSave={() => saveEdit(item)}
                      onDelete={() => deleteItem(item.id)}
                      onToggleBought={() => toggleBought(item)}
                      onAssign={(uid) => assignItem(item.id, uid)}
                      onEditChange={(patch) => setEdit((prev) => ({ ...(prev ?? itemToEditState(item)), ...patch }))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleDetected}
      />

      {pendingProduct && (
        <ScannedProductConfirm
          key={pendingProduct.barcode}
          product={pendingProduct}
          existing={pendingExisting}
          onConfirm={confirmScannedProduct}
          onScanAgain={() => { setPendingProduct(null); setScannerOpen(true); }}
          onCancel={() => setPendingProduct(null)}
        />
      )}
    </div>
  );
}
