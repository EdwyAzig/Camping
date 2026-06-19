"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Lightbulb, Plus, Check, Users } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getEssentialsByScope } from "@/lib/camping-essentials";
import type { TFunction } from "@/lib/i18n/translate";
import { cn } from "@/lib/utils";
import type { Equipment } from "@/lib/types";

function normalizeName(value: string) {
  return value.toLowerCase().trim();
}

function isEssentialInList(name: string, existingNames: string[]) {
  const normalized = normalizeName(name);
  return existingNames.some(
    (existing) => existing.includes(normalized) || normalized.includes(existing)
  );
}

export function PracticalEssentials({
  equipment,
  t,
  onAdd,
  onAddAll,
}: {
  equipment: Equipment[];
  t: TFunction;
  onAdd: (name: string, critical: boolean) => Promise<void>;
  onAddAll: (items: { name: string; critical: boolean }[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addingAll, setAddingAll] = useState(false);

  const groupSection = useMemo(() => getEssentialsByScope("group"), []);

  const existingNames = useMemo(
    () => equipment.map((item) => normalizeName(item.item_name)),
    [equipment]
  );

  const missingItems = useMemo(() => {
    const items: { id: string; name: string; critical: boolean }[] = [];
    for (const category of groupSection.categories) {
      for (const item of category.items) {
        const name = t(item.nameKey);
        if (!isEssentialInList(name, existingNames)) {
          items.push({ id: item.id, name, critical: item.critical ?? false });
        }
      }
    }
    return items;
  }, [existingNames, groupSection, t]);

  async function handleAdd(id: string, nameKey: string, critical?: boolean) {
    setAddingId(id);
    try {
      await onAdd(t(nameKey), critical ?? false);
    } finally {
      setAddingId(null);
    }
  }

  async function handleAddAll() {
    if (missingItems.length === 0) return;
    setAddingAll(true);
    try {
      await onAddAll(missingItems.map(({ name, critical }) => ({ name, critical })));
    } finally {
      setAddingAll(false);
    }
  }

  return (
    <Card className="p-0 overflow-hidden border-glass-border/60 bg-night/10">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-start sm:items-center justify-between gap-3 px-4 py-4 text-left hover:bg-night/20 transition-colors"
      >
        <div className="min-w-0">
          <CardTitle className="text-base mb-1 flex items-center gap-2 text-cream/90">
            <Lightbulb className="w-4 h-4 text-cream/40 shrink-0" />
            {t("equipment.essentials.title")}
          </CardTitle>
          <CardDescription>
            {open ? t("equipment.essentials.subtitleOpen") : t("equipment.essentials.subtitleClosed")}
          </CardDescription>
        </div>
        <ChevronDown className={cn("w-4 h-4 shrink-0 text-cream/40 transition-transform mt-1 sm:mt-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-glass-border/40 pt-4 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-sm font-medium flex items-center gap-2 text-cream/80">
              <Users className="w-4 h-4 text-ember" />
              {t(groupSection.scopeTitleKey)}
            </h3>
            {missingItems.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={addingAll}
                onClick={handleAddAll}
              >
                <Plus className="w-3.5 h-3.5" />
                {t("equipment.essentials.addScope", { count: missingItems.length })}
              </Button>
            )}
          </div>

          {groupSection.categories.map((category) => (
            <section key={category.id}>
              <h4 className="text-xs uppercase tracking-wide text-cream/40 mb-2">{t(category.titleKey)}</h4>
              <ul className="space-y-2">
                {category.items.map((item) => {
                  const name = t(item.nameKey);
                  const inList = isEssentialInList(name, existingNames);
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border px-3 py-2.5",
                        inList ? "border-ember/15 bg-ember/5" : "border-glass-border/60 bg-night/15"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-medium", inList && "text-cream/60")}>{name}</p>
                        <p className="text-xs text-cream/45">{t(item.detailKey)}</p>
                      </div>
                      {inList ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-ember/80 shrink-0">
                          <Check className="w-3.5 h-3.5" />
                          {t("equipment.essentials.inList")}
                        </span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="w-full sm:w-auto shrink-0"
                          disabled={addingId === item.id || addingAll}
                          onClick={() => handleAdd(item.id, item.nameKey, item.critical)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t("equipment.essentials.addItem")}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Card>
  );
}
