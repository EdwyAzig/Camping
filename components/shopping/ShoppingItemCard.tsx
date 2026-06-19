"use client";

import { Pencil, Trash2, Check } from "lucide-react";
import { ProductThumb } from "@/components/shopping/ProductThumb";
import { ItemActions } from "@/components/ui/ItemActions";
import { Input, Select } from "@/components/ui/Input";
import {
  type ItemEditState,
} from "@/components/shopping/ShoppingItemRow";
import { calcLineTotal, deriveUnitPrice, parseQuantityCount } from "@/lib/shopping-utils";
import { formatEuro, cn } from "@/lib/utils";
import type { ShoppingItem, ShoppingCategory, TripMember } from "@/lib/types";

const categories: { value: ShoppingCategory; label: string }[] = [
  { value: "cibo", label: "Cibo" },
  { value: "bevande", label: "Bevande" },
  { value: "altro", label: "Altro" },
];

export function ShoppingItemCard({
  item,
  members,
  editing,
  edit,
  onToggleBought,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onAssign,
  onEditChange,
}: {
  item: ShoppingItem;
  members: TripMember[];
  editing: boolean;
  edit: ItemEditState;
  onToggleBought: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  onAssign: (userId: string) => void;
  onEditChange: (patch: Partial<ItemEditState>) => void;
}) {
  if (editing) {
    const editQty = parseQuantityCount(edit.quantity);
    const editUnit = edit.unit_price ? parseFloat(edit.unit_price) : null;
    const editTotal = calcLineTotal(editQty, editUnit);

    return (
      <div className="rounded-2xl border border-ember/30 bg-night/60 p-4 space-y-3">
        <Input
          value={edit.name}
          onChange={(e) => onEditChange({ name: e.target.value })}
          placeholder="Nome prodotto"
          className="text-base"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={edit.food_type}
            onChange={(e) => onEditChange({ food_type: e.target.value })}
            placeholder="Tipo"
          />
          <Select
            value={edit.category}
            onChange={(e) => onEditChange({ category: e.target.value as ShoppingCategory })}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            min={1}
            value={edit.quantity}
            onChange={(e) => onEditChange({ quantity: e.target.value })}
            className="w-16 text-center"
          />
          <span className="text-cream/40">×</span>
          <Input
            type="number"
            step="0.01"
            value={edit.unit_price}
            onChange={(e) => onEditChange({ unit_price: e.target.value })}
            placeholder="€ cad."
            className="flex-1"
          />
          <span className="text-sm text-ember font-medium">{formatEuro(editTotal)}</span>
        </div>
        {item.bought && (
          <Input
            type="number"
            step="0.01"
            value={edit.actual_price}
            onChange={(e) => onEditChange({ actual_price: e.target.value })}
            placeholder="Pagato totale €"
          />
        )}
        <div className="flex justify-end">
          <ItemActions editing onEdit={() => {}} onDelete={onDelete} onSave={onSave} onCancel={onCancel} />
        </div>
      </div>
    );
  }

  const qty = parseQuantityCount(item.quantity);
  const unitPrice = item.unit_price ?? deriveUnitPrice(item.quantity, item.estimated_price);
  const lineTotal = item.estimated_price ?? calcLineTotal(item.quantity, unitPrice);

  return (
    <div
      className={cn(
        "rounded-2xl border border-glass-border bg-night/40 p-4 space-y-3",
        item.bought && "opacity-70"
      )}
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onToggleBought}
          className={cn(
            "mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors",
            item.bought ? "bg-ember border-ember" : "border-cream/25"
          )}
        >
          {item.bought && <Check className="w-3.5 h-3.5 text-night" />}
        </button>

        {item.image_url && <ProductThumb src={item.image_url} alt={item.name} size="md" />}

        <div className="flex-1 min-w-0">
          <p className={cn("font-medium leading-snug", item.bought && "line-through text-cream/60")}>
            {item.name}
          </p>
          {item.brand && <p className="text-xs text-cream/45 mt-0.5">{item.brand}</p>}
          {item.pack_size && <p className="text-[10px] text-cream/35">{item.pack_size}</p>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-cream/50">
              {qty}× {unitPrice != null ? formatEuro(unitPrice) : "—"}
            </span>
            {item.bought && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/40 text-green-300">Pagato</span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-lg font-[family-name:var(--font-fraunces)] text-ember">{formatEuro(lineTotal)}</p>
          {item.bought && item.actual_price != null && (
            <p className="text-[10px] text-green-400">{formatEuro(item.actual_price)}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-glass-border/50">
        <Select
          className="flex-1 text-xs py-2"
          value={item.assigned_to ?? ""}
          onChange={(e) => onAssign(e.target.value)}
        >
          <option value="">Chi compra…</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
          ))}
        </Select>
        <button type="button" onClick={onEdit} className="p-2 rounded-lg text-cream/40 hover:text-ember">
          <Pencil className="w-4 h-4" />
        </button>
        <button type="button" onClick={onDelete} className="p-2 rounded-lg text-cream/40 hover:text-red-300">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
