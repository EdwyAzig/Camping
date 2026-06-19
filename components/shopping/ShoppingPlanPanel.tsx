"use client";

import { useMemo, useState } from "react";
import { ClipboardPaste, ListPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { parseShoppingListText } from "@/lib/shopping-list-parser";
import { useTranslations } from "@/lib/i18n/client";
import { getShoppingCategoryLabel, getShoppingCategoryOptions } from "@/lib/i18n/enums";
import { getGroupOptions } from "@/lib/shopping-groups";
import { cn } from "@/lib/utils";
import type { ParsedListItem } from "@/lib/shopping-list-parser";
import type { ShoppingCategory, ShoppingGroup } from "@/lib/types";

type PlanTab = "single" | "paste";

export function ShoppingPlanPanel({
  name,
  category,
  quantity,
  foodType,
  groupId,
  groups,
  onNameChange,
  onCategoryChange,
  onQuantityChange,
  onFoodTypeChange,
  onGroupIdChange,
  onAddSingle,
  onPasteAdd,
}: {
  name: string;
  category: ShoppingCategory;
  quantity: string;
  foodType: string;
  groupId: string;
  groups: ShoppingGroup[];
  onNameChange: (v: string) => void;
  onCategoryChange: (v: ShoppingCategory) => void;
  onQuantityChange: (v: string) => void;
  onFoodTypeChange: (v: string) => void;
  onGroupIdChange: (v: string) => void;
  onAddSingle: (e: React.FormEvent) => void;
  onPasteAdd: (items: ParsedListItem[]) => Promise<void>;
}) {
  const { t } = useTranslations();
  const categories = getShoppingCategoryOptions(t);
  const groupOptions = getGroupOptions(groups, t);
  const [tab, setTab] = useState<PlanTab>("single");
  const [pasteText, setPasteText] = useState("");
  const [parsed, setParsed] = useState<ParsedListItem[] | null>(null);
  const [adding, setAdding] = useState(false);

  const preview = useMemo(
    () => (tab === "paste" ? (parsed ?? parseShoppingListText(pasteText)) : []),
    [tab, parsed, pasteText]
  );
  const hasPasteText = pasteText.trim().length > 0;

  async function handlePasteAdd() {
    const items = parsed ?? parseShoppingListText(pasteText);
    if (!items.length) return;
    setAdding(true);
    try {
      await onPasteAdd(items);
      setPasteText("");
      setParsed(null);
      setTab("single");
    } finally {
      setAdding(false);
    }
  }

  return (
    <Card gradient className="animate-fade-up p-0 overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-glass-border/50">
        <CardTitle className="text-lg mb-1">{t("shopping.planTitle")}</CardTitle>
        <CardDescription className="text-xs">{t("shopping.planHint")}</CardDescription>
      </div>

      <div className="flex border-b border-glass-border/50">
        {([
          { id: "single" as const, icon: ListPlus, label: t("shopping.planTabSingle") },
          { id: "paste" as const, icon: ClipboardPaste, label: t("shopping.planTabPaste") },
        ]).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === id
                ? "border-ember text-ember bg-ember/5"
                : "border-transparent text-cream/45 hover:text-cream/70 hover:bg-white/[0.02]"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-5">
        {tab === "single" ? (
          <form onSubmit={onAddSingle} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label>{t("shopping.productLabel")}</Label>
                <Input
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder={t("shopping.productPlaceholder")}
                  required
                  className="text-base"
                />
              </div>
              <div>
                <Label>{t("shopping.groupLabel")}</Label>
                <Select value={groupId} onChange={(e) => onGroupIdChange(e.target.value)}>
                  {groupOptions.map((g) => (
                    <option key={g.value || "general"} value={g.value}>{g.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>{t("common.type")}</Label>
                <Input
                  value={foodType}
                  onChange={(e) => onFoodTypeChange(e.target.value)}
                  placeholder={t("shopping.typePlaceholder")}
                />
              </div>
              <div>
                <Label>{t("common.category")}</Label>
                <Select value={category} onChange={(e) => onCategoryChange(e.target.value as ShoppingCategory)}>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="w-full sm:w-28">
                <Label>{t("shopping.planQtyHint")}</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => onQuantityChange(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto sm:ml-auto">
                <Plus className="w-4 h-4" />
                {t("shopping.addButton")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>{t("shopping.pasteLabel")}</Label>
              <Textarea
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value);
                  setParsed(null);
                }}
                placeholder={t("shopping.pastePlaceholder")}
                rows={7}
                className="text-sm leading-relaxed min-h-[140px]"
                disabled={adding}
              />
            </div>

            {hasPasteText && (
              <div className="rounded-xl bg-night/50 border border-glass-border/60 p-3 space-y-2">
                <p className="text-xs text-cream/50">
                  {preview.length > 0
                    ? t("shopping.pastePreview", { count: preview.length })
                    : t("shopping.pasteEmpty")}
                </p>
                {preview.length > 0 && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                    {preview.map((item, i) => (
                      <li
                        key={`${item.name}-${i}`}
                        className="flex items-center gap-2 text-xs px-2.5 py-2 rounded-lg bg-white/[0.03] border border-glass-border/40 text-cream/75"
                      >
                        {item.quantity > 1 && (
                          <span className="shrink-0 w-6 h-6 rounded-md bg-ember/15 text-ember font-semibold flex items-center justify-center text-[10px]">
                            {item.quantity}
                          </span>
                        )}
                        <span className="truncate flex-1">{item.name}</span>
                        <span className="shrink-0 text-[10px] text-cream/35">
                          {getShoppingCategoryLabel(item.category, t)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setParsed(parseShoppingListText(pasteText))}
                disabled={!hasPasteText || adding}
              >
                {t("shopping.pasteParse")}
              </Button>
              <Button
                type="button"
                onClick={handlePasteAdd}
                disabled={!hasPasteText || preview.length === 0 || adding}
                className="flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4" />
                {t("shopping.pasteAddAll", { count: preview.length })}
              </Button>
              {hasPasteText && (
                <button
                  type="button"
                  onClick={() => { setPasteText(""); setParsed(null); }}
                  className="text-xs text-cream/40 hover:text-cream/60 px-3 py-2"
                  disabled={adding}
                >
                  {t("shopping.pasteClear")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
