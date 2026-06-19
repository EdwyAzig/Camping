"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, ChevronDown, Lock, Plus, Trash2, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import {
  getEssentialsByScope,
  isCustomPackingKey,
  newCustomPackingKey,
} from "@/lib/camping-essentials";
import type { TFunction } from "@/lib/i18n/translate";
import { cn } from "@/lib/utils";
import type { PersonalPackingItem } from "@/lib/types";

function buildCheckedMap(items: PersonalPackingItem[]) {
  const map = new Map<string, boolean>();
  for (const item of items) {
    map.set(item.item_key, item.checked);
  }
  return map;
}

export function PersonalPackingChecklist({
  tripId,
  userId,
  initialItems,
  t,
}: {
  tripId: string;
  userId: string;
  initialItems: PersonalPackingItem[];
  t: TFunction;
}) {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState(initialItems);
  const [newItem, setNewItem] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const personalSection = useMemo(() => getEssentialsByScope("personal"), []);
  const checkedMap = useMemo(() => buildCheckedMap(items), [items]);

  const customItems = useMemo(
    () => items.filter((item) => isCustomPackingKey(item.item_key)),
    [items]
  );

  const predefinedTotal = useMemo(
    () => personalSection.categories.reduce((sum, category) => sum + category.items.length, 0),
    [personalSection]
  );

  const totalCount = predefinedTotal + customItems.length;
  const readyCount = useMemo(() => {
    let count = 0;
    for (const category of personalSection.categories) {
      for (const item of category.items) {
        if (checkedMap.get(item.id)) count += 1;
      }
    }
    for (const item of customItems) {
      if (item.checked) count += 1;
    }
    return count;
  }, [checkedMap, customItems, personalSection]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("personal_packing_items")
      .select("*")
      .eq("trip_id", tripId)
      .eq("user_id", userId)
      .order("created_at");
    if (data) setItems(data as PersonalPackingItem[]);
  }, [tripId, userId]);

  async function toggleItem(itemKey: string, nextChecked: boolean, customLabel?: string | null) {
    setSavingKey(itemKey);
    const supabase = createClient();
    const existing = items.find((item) => item.item_key === itemKey);

    await supabase.from("personal_packing_items").upsert(
      {
        trip_id: tripId,
        user_id: userId,
        item_key: itemKey,
        custom_label: customLabel ?? existing?.custom_label ?? null,
        checked: nextChecked,
      },
      { onConflict: "trip_id,user_id,item_key" }
    );

    await load();
    setSavingKey(null);
  }

  async function addCustomItem(e: React.FormEvent) {
    e.preventDefault();
    const label = newItem.trim();
    if (!label) return;
    setSavingKey("new");
    const supabase = createClient();
    await supabase.from("personal_packing_items").insert({
      trip_id: tripId,
      user_id: userId,
      item_key: newCustomPackingKey(),
      custom_label: label,
      checked: false,
    });
    setNewItem("");
    await load();
    setSavingKey(null);
  }

  async function deleteCustomItem(id: string) {
    setSavingKey(id);
    const supabase = createClient();
    await supabase.from("personal_packing_items").delete().eq("id", id);
    await load();
    setSavingKey(null);
  }

  return (
    <Card className="p-0 overflow-hidden border-moss/25 bg-moss/5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-start sm:items-center justify-between gap-3 px-4 py-4 text-left hover:bg-night/15 transition-colors"
      >
        <div className="min-w-0">
          <CardTitle className="text-base mb-1 flex items-center gap-2">
            <User className="w-4 h-4 text-moss shrink-0" />
            {t("equipment.personal.title")}
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-night/40 border border-glass-border text-cream/50 font-sans font-medium">
              <Lock className="w-3 h-3" />
              {t("equipment.personal.onlyYou")}
            </span>
          </CardTitle>
          <CardDescription>
            {t("equipment.personal.subtitle", { ready: readyCount, total: totalCount })}
          </CardDescription>
        </div>
        <ChevronDown className={cn("w-4 h-4 shrink-0 text-cream/40 transition-transform mt-1 sm:mt-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-glass-border/40 pt-4 space-y-5">
          {personalSection.categories.map((category) => (
            <section key={category.id}>
              <h3 className="text-xs uppercase tracking-wide text-cream/40 mb-2">{t(category.titleKey)}</h3>
              <ul className="space-y-2">
                {category.items.map((item) => {
                  const checked = checkedMap.get(item.id) ?? false;
                  return (
                    <li key={item.id}>
                      <div
                        className={cn(
                          "flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                          checked ? "border-ember/20 bg-ember/5" : "border-glass-border/60 bg-night/15"
                        )}
                      >
                        <button
                          type="button"
                          disabled={savingKey === item.id}
                          onClick={() => toggleItem(item.id, !checked)}
                          className={cn(
                            "w-6 h-6 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0",
                            checked ? "bg-ember border-ember" : "border-cream/30"
                          )}
                        >
                          {checked && <Check className="w-3.5 h-3.5 text-night" />}
                        </button>
                        <span className="min-w-0 flex-1">
                          <span className={cn("block text-sm font-medium", checked && "text-cream/55 line-through")}>
                            {t(item.nameKey)}
                          </span>
                          <span className="block text-xs text-cream/45">{t(item.detailKey)}</span>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {customItems.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-wide text-cream/40 mb-2">{t("equipment.personal.customSection")}</h3>
              <ul className="space-y-2">
                {customItems.map((item) => (
                  <li key={item.id}>
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                        item.checked ? "border-ember/20 bg-ember/5" : "border-glass-border/60 bg-night/15"
                      )}
                    >
                      <button
                        type="button"
                        disabled={savingKey === item.id}
                        onClick={() => toggleItem(item.item_key, !item.checked, item.custom_label)}
                        className={cn(
                          "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0",
                          item.checked ? "bg-ember border-ember" : "border-cream/30"
                        )}
                      >
                        {item.checked && <Check className="w-3.5 h-3.5 text-night" />}
                      </button>
                      <span className={cn("flex-1 text-sm font-medium min-w-0 break-words", item.checked && "text-cream/55 line-through")}>
                        {item.custom_label}
                      </span>
                      <button
                        type="button"
                        disabled={savingKey === item.id}
                        onClick={() => deleteCustomItem(item.id)}
                        className="p-1.5 text-cream/35 hover:text-red-300 rounded-lg hover:bg-red-950/30 transition-colors shrink-0"
                        title={t("common.delete")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <form onSubmit={addCustomItem} className="flex flex-col sm:flex-row gap-2 pt-1">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder={t("equipment.personal.customPlaceholder")}
              className="flex-1 min-w-0"
            />
            <Button type="submit" size="sm" variant="secondary" disabled={savingKey === "new"} className="w-full sm:w-auto shrink-0">
              <Plus className="w-4 h-4" />
              {t("equipment.personal.addCustom")}
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}
