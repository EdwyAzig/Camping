"use client";

import { Fragment, useCallback, useState } from "react";
import { Flame, ScanBarcode, ShoppingBag, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/Progress";
import { BarcodeScanner } from "@/components/shopping/BarcodeScanner";
import { ScannedProductConfirm } from "@/components/shopping/ScannedProductConfirm";
import { ShoppingGroupsPanel } from "@/components/shopping/ShoppingGroupsPanel";
import { ShoppingItemCard } from "@/components/shopping/ShoppingItemCard";
import { ShoppingPlanPanel } from "@/components/shopping/ShoppingPlanPanel";
import {
  ShoppingItemRow,
  itemToEditState,
  type ItemEditState,
} from "@/components/shopping/ShoppingItemRow";
import { calcShoppingPaid, calcShoppingRemaining } from "@/lib/finance";
import type { OffProduct } from "@/lib/open-food-facts";
import { calcLineTotal, parseQuantityCount } from "@/lib/shopping-utils";
import { groupItemsByShoppingGroup } from "@/lib/shopping-groups";
import { useTranslations, useFormatEuro } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { ParsedListItem } from "@/lib/shopping-list-parser";
import type { ShoppingItem, ShoppingCategory, ShoppingGroup, TripMember, Trip } from "@/lib/types";

type ScanConfirmData = {
  name: string;
  category: ShoppingCategory;
  foodType: string;
  groupId: string;
  quantity: string;
  unitPrice: string;
  packSize: string;
  incrementExisting: boolean;
};

function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-1 pt-1">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-cream/55">{label}</h3>
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/5 text-cream/35">{count}</span>
    </div>
  );
}

function SectionHeader({
  title,
  count,
  variant,
}: {
  title: string;
  count: number;
  variant: "pending" | "done";
}) {
  const Icon = variant === "pending" ? ShoppingBag : CheckCircle2;
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={cn("w-4 h-4", variant === "pending" ? "text-ember" : "text-green-400/80")} />
      <h2 className="font-[family-name:var(--font-fraunces)] text-base text-cream">{title}</h2>
      <span
        className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-full",
          variant === "pending" ? "bg-ember/15 text-ember" : "bg-green-900/30 text-green-300"
        )}
      >
        {count}
      </span>
    </div>
  );
}

export function ShoppingList({
  trip,
  members,
  initialItems,
  initialGroups,
}: {
  trip: Trip;
  members: TripMember[];
  initialItems: ShoppingItem[];
  initialGroups: ShoppingGroup[];
}) {
  const tripId = trip.id;
  const { t } = useTranslations();
  const formatEuro = useFormatEuro();

  const [items, setItems] = useState(initialItems);
  const [groups, setGroups] = useState(initialGroups);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ShoppingCategory>("cibo");
  const [quantity, setQuantity] = useState("1");
  const [foodType, setFoodType] = useState("");
  const [groupId, setGroupId] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<ShoppingItem | null>(null);
  const [pendingProduct, setPendingProduct] = useState<OffProduct | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<ItemEditState | null>(null);

  const loadItems = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("shopping_items").select("*").eq("trip_id", tripId).order("created_at");
    if (data) setItems(data as ShoppingItem[]);
  }, [tripId]);

  const loadGroups = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("shopping_groups")
      .select("*")
      .eq("trip_id", tripId)
      .order("sort_order")
      .order("created_at");
    if (data) setGroups(data as ShoppingGroup[]);
  }, [tripId]);

  const load = useCallback(async () => {
    await Promise.all([loadItems(), loadGroups()]);
  }, [loadItems, loadGroups]);

  useRealtimeTable("shopping_items", tripId, loadItems);
  useRealtimeTable("shopping_groups", tripId, loadGroups);

  function startScan(item?: ShoppingItem) {
    setScanTarget(item ?? null);
    setScannerOpen(true);
  }

  function handleDetected(product: OffProduct) {
    setScannerOpen(false);
    setPendingProduct(product);
  }

  function buildProductPayload(product: OffProduct, data: ScanConfirmData) {
    const qty = parseQuantityCount(data.quantity);
    const unit = data.unitPrice ? parseFloat(data.unitPrice) : null;
    const lineTotal = calcLineTotal(qty, unit);
    return {
      name: data.name.trim() || product.name || t("common.productWithBarcode", { barcode: product.barcode }),
      category: data.category,
      quantity: String(qty),
      unit_price: unit,
      estimated_price: lineTotal,
      actual_price: lineTotal,
      food_type: data.foodType.trim() || product.foodType || null,
      group_id: data.groupId || null,
      brand: product.brand,
      barcode: product.barcode,
      image_url: product.imageUrl,
      pack_size: data.packSize || product.packSize || null,
      bought: true,
      source: product.name ? "openfoodfacts" as const : "manual" as const,
    };
  }

  async function fulfillPlannedItem(data: ScanConfirmData) {
    if (!pendingProduct || !scanTarget) return;
    const supabase = createClient();
    const payload = buildProductPayload(pendingProduct, {
      ...data,
      name: data.name.trim() || pendingProduct.name || scanTarget.name,
      foodType: data.foodType.trim() || pendingProduct.foodType || scanTarget.food_type || "",
    });
    await supabase.from("shopping_items").update(payload).eq("id", scanTarget.id);
    setPendingProduct(null);
    setScanTarget(null);
    await loadItems();
  }

  async function confirmUnplannedPurchase(data: ScanConfirmData) {
    if (!pendingProduct) return;
    const supabase = createClient();
    const existing = items.find((i) => i.barcode === pendingProduct.barcode && !i.bought);
    const qty = parseQuantityCount(data.quantity);
    const unit = data.unitPrice ? parseFloat(data.unitPrice) : null;

    if (existing && data.incrementExisting) {
      const newQty = parseQuantityCount(existing.quantity) + qty;
      const useUnit = unit ?? existing.unit_price;
      const lineTotal = calcLineTotal(newQty, useUnit);
      await supabase.from("shopping_items").update({
        quantity: String(newQty),
        unit_price: useUnit,
        estimated_price: lineTotal,
        actual_price: lineTotal,
        bought: true,
      }).eq("id", existing.id);
    } else {
      await supabase.from("shopping_items").insert({
        trip_id: tripId,
        ...buildProductPayload(pendingProduct, data),
      });
    }

    setPendingProduct(null);
    setScanTarget(null);
    await loadItems();
  }

  async function handleScanConfirm(data: ScanConfirmData) {
    if (scanTarget) {
      await fulfillPlannedItem(data);
    } else {
      await confirmUnplannedPurchase(data);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const supabase = createClient();
    const qty = parseQuantityCount(quantity);
    await supabase.from("shopping_items").insert({
      trip_id: tripId,
      name: name.trim(),
      category,
      quantity: String(qty),
      unit_price: null,
      estimated_price: null,
      food_type: foodType.trim() || null,
      group_id: groupId || null,
      source: "manual",
      bought: false,
    });
    setName("");
    setQuantity("1");
    setFoodType("");
    setGroupId("");
    setCategory("cibo");
    loadItems();
  }

  async function handlePasteAdd(parsed: ParsedListItem[]) {
    if (!parsed.length) return;
    const supabase = createClient();
    await supabase.from("shopping_items").insert(
      parsed.map((p) => ({
        trip_id: tripId,
        name: p.name,
        category: p.category,
        quantity: String(p.quantity),
        unit_price: null,
        estimated_price: null,
        food_type: null,
        group_id: null,
        source: "manual" as const,
        bought: false,
      }))
    );
    await loadItems();
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
    loadItems();
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
      group_id: edit.group_id || null,
      category: edit.category,
      quantity: String(qty),
      unit_price: unit,
      estimated_price: total,
      actual_price: item.bought && edit.actual_price ? parseFloat(edit.actual_price) : item.actual_price,
    }).eq("id", item.id);
    setEditingId(null);
    setEdit(null);
    loadItems();
  }

  async function deleteItem(id: string) {
    const supabase = createClient();
    await supabase.from("shopping_items").delete().eq("id", id);
    if (editingId === id) { setEditingId(null); setEdit(null); }
    loadItems();
  }

  async function assignItem(itemId: string, userId: string) {
    const supabase = createClient();
    await supabase.from("shopping_items").update({ assigned_to: userId || null }).eq("id", itemId);
    loadItems();
  }

  const total = items.reduce((s, i) => {
    const line = i.estimated_price ?? calcLineTotal(i.quantity, i.unit_price) ?? 0;
    if (i.bought) return s + (i.actual_price ?? line);
    return s + line;
  }, 0);
  const paid = calcShoppingPaid(items);
  const remaining = calcShoppingRemaining(items);
  const boughtCount = items.filter((i) => i.bought).length;
  const progressPct = items.length ? Math.round((boughtCount / items.length) * 100) : 0;
  const toBuy = items.filter((i) => !i.bought);
  const bought = items.filter((i) => i.bought);
  const pendingExisting = pendingProduct && !scanTarget
    ? items.find((i) => i.barcode === pendingProduct.barcode && !i.bought) ?? null
    : null;

  const itemProps = (item: ShoppingItem) => ({
    item,
    members,
    groups,
    editing: editingId === item.id,
    edit: edit ?? itemToEditState(item),
    onEdit: () => startEdit(item),
    onCancel: () => { setEditingId(null); setEdit(null); },
    onSave: () => saveEdit(item),
    onDelete: () => deleteItem(item.id),
    onToggleBought: () => toggleBought(item),
    onAssign: (uid: string) => assignItem(item.id, uid),
    onEditChange: (patch: Partial<ItemEditState>) =>
      setEdit((prev) => ({ ...(prev ?? itemToEditState(item)), ...patch })),
    onScan: !item.bought ? () => startScan(item) : undefined,
  });

  const listTable = (listItems: ShoppingItem[]) => {
    const sections = groupItemsByShoppingGroup(listItems, groups, t);
    return (
      <Card gradient className="hidden md:block p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-night/40 text-cream/50 border-b border-glass-border">
                <th className="p-3 w-8"></th>
                <th className="text-left p-3">{t("shopping.tableProduct")}</th>
                <th className="text-left p-3">{t("shopping.tableType")}</th>
                <th className="text-center p-3">{t("shopping.tableQty")}</th>
                <th className="text-right p-3">{t("shopping.tableTotal")}</th>
                <th className="text-right p-3">{t("shopping.tablePaid")}</th>
                <th className="text-left p-3">{t("shopping.tableWho")}</th>
                <th className="p-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {sections.map(({ key, label, items: groupItems }) => (
                <Fragment key={key ?? "general"}>
                  <tr className="bg-night/30 border-b border-glass-border/40">
                    <td colSpan={8} className="px-3 py-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-cream/55">{label}</span>
                      <span className="ml-2 text-[10px] text-cream/35">{groupItems.length}</span>
                    </td>
                  </tr>
                  {groupItems.map((item) => (
                    <ShoppingItemRow key={item.id} {...itemProps(item)} />
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  const mobileList = (listItems: ShoppingItem[]) => (
    <div className="md:hidden space-y-4">
      {groupItemsByShoppingGroup(listItems, groups, t).map(({ key, label, items: groupItems }) => (
        <div key={key ?? "general"} className="space-y-2">
          <GroupHeader label={label} count={groupItems.length} />
          <div className="space-y-3">
            {groupItems.map((item) => (
              <ShoppingItemCard key={item.id} {...itemProps(item)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={t("shopping.title")}
        description={t("shopping.description", { bought: boughtCount, total: items.length, amount: formatEuro(total) })}
        icon={Flame}
        badge={t("shopping.badge")}
      />

      {items.length > 0 && (
        <Card gradient className="animate-fade-up p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatCard label={t("shopping.alreadyPaid")} value={formatEuro(paid)} accent />
            <StatCard label={t("shopping.toPay")} value={formatEuro(remaining)} />
            <StatCard label={t("shopping.listTotal")} value={formatEuro(total)} />
          </div>
          <div>
            <div className="flex justify-between text-xs text-cream/50 mb-1.5">
              <span>{t("shopping.purchaseProgress")}</span>
              <span className="text-ember font-medium">{progressPct}%</span>
            </div>
            <div className="progress-track h-2.5">
              <div className="progress-fill transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </Card>
      )}

      <ShoppingGroupsPanel tripId={tripId} groups={groups} onChange={loadGroups} />

      <ShoppingPlanPanel
        name={name}
        category={category}
        quantity={quantity}
        foodType={foodType}
        groupId={groupId}
        groups={groups}
        onNameChange={setName}
        onCategoryChange={setCategory}
        onQuantityChange={setQuantity}
        onFoodTypeChange={setFoodType}
        onGroupIdChange={setGroupId}
        onAddSingle={handleAdd}
        onPasteAdd={handlePasteAdd}
      />

      {items.length === 0 ? (
        <Card gradient className="animate-fade-up animate-fade-up-delay-1 border-dashed border-glass-border">
          <div className="text-center py-10 sm:py-12 text-cream/50 space-y-2 px-4">
            <ShoppingBag className="w-10 h-10 mx-auto text-cream/15" />
            <p className="font-[family-name:var(--font-fraunces)] text-cream/70">{t("shopping.emptyTitle")}</p>
            <p className="text-xs max-w-sm mx-auto leading-relaxed">{t("shopping.emptyHint")}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {toBuy.length > 0 && (
            <section className="space-y-3 animate-fade-up animate-fade-up-delay-1">
              <SectionHeader title={t("shopping.sectionToBuy")} count={toBuy.length} variant="pending" />
              {mobileList(toBuy)}
              {listTable(toBuy)}
            </section>
          )}

          {bought.length > 0 && (
            <section className="space-y-3 animate-fade-up animate-fade-up-delay-2">
              <SectionHeader title={t("shopping.sectionBought")} count={bought.length} variant="done" />
              {mobileList(bought)}
              {listTable(bought)}
            </section>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => startScan()}
        className="w-full group rounded-2xl border border-dashed border-glass-border/80 bg-night/20 hover:bg-night/40 hover:border-cream/20 px-4 py-3.5 flex items-center justify-center gap-3 text-sm text-cream/45 hover:text-cream/65 transition-all"
      >
        <span className="w-9 h-9 rounded-xl bg-white/5 group-hover:bg-white/8 flex items-center justify-center transition-colors">
          <ScanBarcode className="w-4 h-4" />
        </span>
        <span className="text-left">
          <span className="block text-cream/70 group-hover:text-cream/85">{t("shopping.scanUnplanned")}</span>
          <span className="block text-[11px] text-cream/35 mt-0.5">{t("shopping.scanUnplannedHint")}</span>
        </span>
      </button>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => { setScannerOpen(false); if (!pendingProduct) setScanTarget(null); }}
        onDetected={handleDetected}
      />

      {pendingProduct && (
        <ScannedProductConfirm
          key={`${pendingProduct.barcode}-${scanTarget?.id ?? "unplanned"}`}
          product={pendingProduct}
          plannedItem={scanTarget}
          existing={pendingExisting}
          groups={groups}
          onConfirm={handleScanConfirm}
          onScanAgain={() => { setPendingProduct(null); setScannerOpen(true); }}
          onCancel={() => { setPendingProduct(null); setScanTarget(null); }}
        />
      )}
    </div>
  );
}
