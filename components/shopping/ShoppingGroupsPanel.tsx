"use client";

import { useState } from "react";
import { FolderPlus, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { useTranslations } from "@/lib/i18n/client";
import type { ShoppingGroup } from "@/lib/types";

export function ShoppingGroupsPanel({
  tripId,
  groups,
  onChange,
}: {
  tripId: string;
  groups: ShoppingGroup[];
  onChange: () => void;
}) {
  const { t } = useTranslations();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      const supabase = createClient();
      const nextOrder = groups.length
        ? Math.max(...groups.map((g) => g.sort_order)) + 1
        : 0;
      await supabase.from("shopping_groups").insert({
        trip_id: tripId,
        name: trimmed,
        sort_order: nextOrder,
      });
      setName("");
      onChange();
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("shopping_groups").delete().eq("id", id);
    onChange();
  }

  return (
    <Card gradient className="animate-fade-up p-4 sm:p-5 space-y-4">
      <div>
        <CardTitle className="text-lg mb-1 flex items-center gap-2">
          <FolderPlus className="w-4 h-4 text-ember" />
          {t("shopping.groupsTitle")}
        </CardTitle>
        <CardDescription className="text-xs">{t("shopping.groupsHint")}</CardDescription>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("shopping.groupNamePlaceholder")}
          className="flex-1"
          disabled={adding}
        />
        <Button type="submit" disabled={!name.trim() || adding} className="shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t("shopping.addGroup")}</span>
        </Button>
      </form>

      {groups.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <li
              key={group.id}
              className="flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-xl bg-white/5 border border-glass-border/60 text-sm text-cream/80"
            >
              <span>{group.name}</span>
              <button
                type="button"
                onClick={() => handleDelete(group.id)}
                className="p-1.5 rounded-lg text-cream/35 hover:text-red-300 hover:bg-white/5"
                aria-label={t("shopping.deleteGroup", { name: group.name })}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-cream/40">{t("shopping.groupsEmpty")}</p>
      )}
    </Card>
  );
}
