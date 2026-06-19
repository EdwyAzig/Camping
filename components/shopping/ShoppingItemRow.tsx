"use client";

import { ScanBarcode } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { ItemActions } from "@/components/ui/ItemActions";
import { ProductThumb } from "@/components/shopping/ProductThumb";
import { calcLineTotal, deriveUnitPrice, parseQuantityCount } from "@/lib/shopping-utils";
import { cn } from "@/lib/utils";
import { useTranslations, useFormatEuro } from "@/lib/i18n/client";
import { getShoppingCategoryLabel, getShoppingCategoryOptions } from "@/lib/i18n/enums";
import { getGroupLabel, getGroupOptions } from "@/lib/shopping-groups";
import type { ShoppingItem, ShoppingCategory, ShoppingGroup, TripMember } from "@/lib/types";

export interface ItemEditState {
  name: string;
  food_type: string;
  category: ShoppingCategory;
  group_id: string;
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
    group_id: item.group_id ?? "",
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
  onScan,
  groups,
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
  onScan?: () => void;
  groups: ShoppingGroup[];
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
      <tr className="border-b border-glass-border/50 bg-night/30">
        <td className="p-2" colSpan={8}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <Input
              value={edit.name}
              onChange={(e) => onEditChange({ name: e.target.value })}
              placeholder={t("shopping.editProductName")}
              className="text-sm sm:col-span-2"
            />
            <Input
              value={edit.food_type}
              onChange={(e) => onEditChange({ food_type: e.target.value })}
              placeholder={t("shopping.editFoodType")}
              className="text-sm"
            />
            <Select
              value={edit.group_id}
              onChange={(e) => onEditChange({ group_id: e.target.value })}
              className="text-sm"
            >
              {groupOptions.map((g) => (
                <option key={g.value || "general"} value={g.value}>{g.label}</option>
              ))}
            </Select>
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
                placeholder={t("shopping.editQty")}
                className="text-sm w-16"
              />
              <span className="text-xs text-cream/40">×</span>
              <Input
                type="number"
                step="0.01"
                value={edit.unit_price}
                onChange={(e) => onEditChange({ unit_price: e.target.value })}
                placeholder={t("shopping.editUnitPrice")}
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
                placeholder={t("shopping.editPaidTotal")}
                className="text-sm"
              />
            )}
            {item.pack_size && (
              <p className="text-xs text-cream/40 sm:col-span-2">{t("common.packSize", { size: item.pack_size })}</p>
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
            {item.group_id && (
              <p className="text-[10px] text-ember/70">{getGroupLabel(item.group_id, groups, t)}</p>
            )}
            {item.pack_size && <p className="text-[10px] text-cream/35">{item.pack_size}</p>}
          </div>
        </div>
      </td>
      <td className="p-3 text-cream/60 text-xs whitespace-nowrap">
        {item.food_type ?? getShoppingCategoryLabel(item.category, t)}
      </td>
      <td className="p-3 text-center whitespace-nowrap">
        <span className="font-medium">{qty}</span>
        {unitPrice != null && (
          <p className="text-[10px] text-cream/40">{t("common.perUnit", { price: formatEuro(unitPrice) })}</p>
        )}
      </td>
      <td className="p-3 text-right text-ember font-medium whitespace-nowrap">
        {lineTotal != null ? formatEuro(lineTotal) : t("common.dash")}
      </td>
      <td className="p-3 text-right whitespace-nowrap">
        {item.bought ? (
          <span className="text-green-400">{formatEuro(item.actual_price ?? lineTotal)}</span>
        ) : (
          <span className="text-cream/30">{t("common.dash")}</span>
        )}
      </td>
      <td className="p-3">
        <Select
          className="text-xs py-1 min-w-[90px]"
          value={item.assigned_to ?? ""}
          onChange={(e) => onAssign(e.target.value)}
        >
          <option value="">{t("common.dash")}</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
          ))}
        </Select>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1">
          {!item.bought && onScan && (
            <button
              type="button"
              onClick={onScan}
              title={t("shopping.scanToBuy")}
              className="p-2 rounded-lg text-ember hover:bg-ember/10"
            >
              <ScanBarcode className="w-4 h-4" />
            </button>
          )}
          <ItemActions onEdit={onEdit} onDelete={onDelete} />
        </div>
      </td>
    </tr>
  );
}
