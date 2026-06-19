"use client";

import { Pencil, Trash2, Check, ScanBarcode, Package } from "lucide-react";
import { ProductThumb } from "@/components/shopping/ProductThumb";
import { ItemActions } from "@/components/ui/ItemActions";
import { Input, Select } from "@/components/ui/Input";
import { type ItemEditState } from "@/components/shopping/ShoppingItemRow";
import { calcLineTotal, deriveUnitPrice, parseQuantityCount } from "@/lib/shopping-utils";
import { getGroupLabel, getGroupOptions } from "@/lib/shopping-groups";
import { cn } from "@/lib/utils";
import { useTranslations, useFormatEuro } from "@/lib/i18n/client";
import { getShoppingCategoryLabel, getShoppingCategoryOptions } from "@/lib/i18n/enums";
import type { ShoppingItem, ShoppingCategory, ShoppingGroup, TripMember } from "@/lib/types";

export function ShoppingItemCard({
  item,
  members,
  groups,
  editing,
  edit,
  onToggleBought,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onAssign,
  onEditChange,
  onScan,
}: {
  item: ShoppingItem;
  members: TripMember[];
  groups: ShoppingGroup[];
  editing: boolean;
  edit: ItemEditState;
  onToggleBought: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  onAssign: (userId: string) => void;
  onEditChange: (patch: Partial<ItemEditState>) => void;
  onScan?: () => void;
}) {
  const { t } = useTranslations();
  const formatEuro = useFormatEuro();
  const categories = getShoppingCategoryOptions(t);
  const groupOptions = getGroupOptions(groups, t);

  if (editing) {
    const editQty = parseQuantityCount(edit.quantity);
    const editUnit = edit.unit_price ? parseFloat(edit.unit_price) : null;
    const editTotal = calcLineTotal(editQty, editUnit);

    return (
      <div className="rounded-2xl border border-ember/30 bg-night/60 p-4 space-y-3">
        <Input
          value={edit.name}
          onChange={(e) => onEditChange({ name: e.target.value })}
          placeholder={t("shopping.editProductName")}
          className="text-base"
        />
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={edit.group_id}
            onChange={(e) => onEditChange({ group_id: e.target.value })}
          >
            {groupOptions.map((g) => (
              <option key={g.value || "general"} value={g.value}>{g.label}</option>
            ))}
          </Select>
          <Input
            value={edit.food_type}
            onChange={(e) => onEditChange({ food_type: e.target.value })}
            placeholder={t("common.type")}
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
            placeholder={t("shopping.editUnitPrice")}
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
            placeholder={t("shopping.editPaidTotal")}
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
  const isPending = !item.bought;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-night/40 overflow-hidden transition-colors",
        isPending
          ? "border-glass-border border-l-[3px] border-l-ember/60"
          : "border-glass-border/60 opacity-80"
      )}
    >
      <div className="p-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onToggleBought}
            className={cn(
              "mt-0.5 w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors",
              item.bought ? "bg-ember border-ember" : "border-cream/20 hover:border-ember/40"
            )}
          >
            {item.bought && <Check className="w-3.5 h-3.5 text-night" />}
          </button>

          {item.image_url ? (
            <ProductThumb src={item.image_url} alt={item.name} size="md" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-glass-border/50 flex items-center justify-center shrink-0">
              <Package className={cn("w-5 h-5", isPending ? "text-cream/25" : "text-cream/20")} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              {isPending && qty > 1 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-ember/15 text-ember">
                  ~{qty}
                </span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-cream/45">
                {getShoppingCategoryLabel(item.category, t)}
              </span>
              {item.group_id && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ember/10 text-ember/80">
                  {getGroupLabel(item.group_id, groups, t)}
                </span>
              )}
            </div>
            <p className={cn("font-medium leading-snug text-cream", item.bought && "line-through text-cream/55")}>
              {item.name}
            </p>
            {item.brand && <p className="text-xs text-cream/45 mt-0.5 truncate">{item.brand}</p>}
            {item.pack_size && <p className="text-[10px] text-cream/35 mt-0.5">{item.pack_size}</p>}
            {item.bought && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-cream/50">
                  {qty}× {unitPrice != null ? formatEuro(unitPrice) : t("common.dash")}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/40 text-green-300">
                  {t("common.paid")}
                </span>
              </div>
            )}
          </div>

          <div className="text-right shrink-0 pl-1">
            <p className="text-lg font-[family-name:var(--font-fraunces)] text-ember leading-tight">
              {lineTotal != null ? formatEuro(lineTotal) : (
                isPending ? (
                  <span className="text-sm text-cream/30 font-sans">{t("shopping.priceAtScan")}</span>
                ) : t("common.dash")
              )}
            </p>
            {item.bought && item.actual_price != null && (
              <p className="text-[10px] text-green-400 mt-0.5">{formatEuro(item.actual_price)}</p>
            )}
          </div>
        </div>

        {isPending && onScan && (
          <button
            type="button"
            onClick={onScan}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-ember/20 to-ember/10 border border-ember/30 text-ember text-sm font-medium hover:from-ember/30 hover:to-ember/15 active:scale-[0.99] transition-all"
          >
            <ScanBarcode className="w-4 h-4" />
            {t("shopping.scanToBuy")}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-glass-border/40 bg-night/30">
        <Select
          className="flex-1 text-xs py-2 min-w-0"
          value={item.assigned_to ?? ""}
          onChange={(e) => onAssign(e.target.value)}
        >
          <option value="">{t("shopping.whoBuys")}</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
          ))}
        </Select>
        <button type="button" onClick={onEdit} className="p-2 rounded-lg text-cream/40 hover:text-ember hover:bg-white/5">
          <Pencil className="w-4 h-4" />
        </button>
        <button type="button" onClick={onDelete} className="p-2 rounded-lg text-cream/40 hover:text-red-300 hover:bg-white/5">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
