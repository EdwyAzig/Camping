"use client";

import { Input, Select } from "@/components/ui/Input";
import { ItemActions } from "@/components/ui/ItemActions";
import { ProductThumb } from "@/components/shopping/ProductThumb";
import { calcLineTotal, deriveUnitPrice, parseQuantityCount } from "@/lib/shopping-utils";
import { formatEuro, cn } from "@/lib/utils";
import type { ShoppingItem, ShoppingCategory, TripMember } from "@/lib/types";

const categories: { value: ShoppingCategory; label: string }[] = [
  { value: "cibo", label: "Cibo" },
  { value: "bevande", label: "Bevande" },
  { value: "altro", label: "Altro" },
];

export interface ItemEditState {
  name: string;
  food_type: string;
  category: ShoppingCategory;
  quantity: string;
  unit_price: string;
  actual_price: string;
}

export function itemToEditState(item: ShoppingItem): ItemEditState {
  const unit = item.unit_price ?? deriveUnitPrice(item.quantity, item.estimated_price) ?? null;
  return {
    name: item.name,
    food_type: item.food_type ?? "",
    category: item.category,
    quantity: String(parseQuantityCount(item.quantity)),
    unit_price: unit != null ? String(unit) : "",
    actual_price: item.actual_price != null ? String(item.actual_price) : "",
  };
}

export function ShoppingItemRow({
  item,
  members,
  editing,
  edit,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onToggleBought,
  onAssign,
  onEditChange,
}: {
  item: ShoppingItem;
  members: TripMember[];
  editing: boolean;
  edit: ItemEditState;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  onToggleBought: () => void;
  onAssign: (userId: string) => void;
  onEditChange: (patch: Partial<ItemEditState>) => void;
}) {
  if (editing) {
    const editQty = parseQuantityCount(edit.quantity);
    const editUnit = edit.unit_price ? parseFloat(edit.unit_price) : null;
    const editTotal = calcLineTotal(editQty, editUnit);

    return (
      <tr className="border-b border-glass-border/50 bg-night/30">
        <td className="p-2" colSpan={8}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <Input
              value={edit.name}
              onChange={(e) => onEditChange({ name: e.target.value })}
              placeholder="Nome prodotto"
              className="text-sm sm:col-span-2"
            />
            <Input
              value={edit.food_type}
              onChange={(e) => onEditChange({ food_type: e.target.value })}
              placeholder="Tipo cibo"
              className="text-sm"
            />
            <Select
              value={edit.category}
              onChange={(e) => onEditChange({ category: e.target.value as ShoppingCategory })}
              className="text-sm"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
            <div className="flex gap-2 items-center sm:col-span-2">
              <Input
                type="number"
                min={1}
                value={edit.quantity}
                onChange={(e) => onEditChange({ quantity: e.target.value })}
                placeholder="Qtà"
                className="text-sm w-16"
              />
              <span className="text-xs text-cream/40">×</span>
              <Input
                type="number"
                step="0.01"
                value={edit.unit_price}
                onChange={(e) => onEditChange({ unit_price: e.target.value })}
                placeholder="€ cad."
                className="text-sm flex-1"
              />
              <span className="text-sm text-ember font-medium whitespace-nowrap">
                = {formatEuro(editTotal)}
              </span>
            </div>
            {item.bought && (
              <Input
                type="number"
                step="0.01"
                value={edit.actual_price}
                onChange={(e) => onEditChange({ actual_price: e.target.value })}
                placeholder="Pagato totale €"
                className="text-sm"
              />
            )}
            {item.pack_size && (
              <p className="text-xs text-cream/40 sm:col-span-2">Confezione: {item.pack_size}</p>
            )}
          </div>
          <div className="flex justify-end mt-2">
            <ItemActions editing onEdit={() => {}} onDelete={onDelete} onSave={onSave} onCancel={onCancel} />
          </div>
        </td>
      </tr>
    );
  }

  const qty = parseQuantityCount(item.quantity);
  const unitPrice = item.unit_price ?? deriveUnitPrice(item.quantity, item.estimated_price);
  const lineTotal = item.estimated_price ?? calcLineTotal(item.quantity, unitPrice);

  return (
    <tr className={cn("border-b border-glass-border/50", item.bought && "opacity-75")}>
      <td className="p-3">
        <button
          onClick={onToggleBought}
          className={cn(
            "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
            item.bought ? "bg-ember border-ember" : "border-cream/30"
          )}
        >
          {item.bought && <span className="text-night text-xs">✓</span>}
        </button>
      </td>
      <td className={cn("p-3 min-w-[140px]", item.bought && "line-through")}>
        <div className="flex items-center gap-2.5">
          {item.image_url && <ProductThumb src={item.image_url} alt={item.name} />}
          <div className="min-w-0">
            <p className="font-medium leading-tight">{item.name}</p>
            {item.brand && <p className="text-xs text-cream/40">{item.brand}</p>}
            {item.pack_size && <p className="text-[10px] text-cream/35">{item.pack_size}</p>}
          </div>
        </div>
      </td>
      <td className="p-3 text-cream/60 text-xs whitespace-nowrap">
        {item.food_type ?? categories.find((c) => c.value === item.category)?.label ?? "—"}
      </td>
      <td className="p-3 text-center whitespace-nowrap">
        <span className="font-medium">{qty}</span>
        {unitPrice != null && (
          <p className="text-[10px] text-cream/40">{formatEuro(unitPrice)} cad.</p>
        )}
      </td>
      <td className="p-3 text-right text-ember font-medium whitespace-nowrap">
        {formatEuro(lineTotal)}
      </td>
      <td className="p-3 text-right whitespace-nowrap">
        {item.bought ? (
          <span className="text-green-400">{formatEuro(item.actual_price ?? lineTotal)}</span>
        ) : (
          <span className="text-cream/30">—</span>
        )}
      </td>
      <td className="p-3">
        <Select
          className="text-xs py-1 min-w-[90px]"
          value={item.assigned_to ?? ""}
          onChange={(e) => onAssign(e.target.value)}
        >
          <option value="">—</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
          ))}
        </Select>
      </td>
      <td className="p-3">
        <ItemActions onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
}
