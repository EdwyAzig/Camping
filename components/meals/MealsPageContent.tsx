"use client";

import { useCallback, useState } from "react";
import { Plus, ChefHat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ItemActions } from "@/components/ui/ItemActions";
import { useTranslations } from "@/lib/i18n/client";
import type { Meal, TripMember } from "@/lib/types";

export function MealsPageContent({
  tripId,
  members,
  initialMeals,
}: {
  tripId: string;
  members: TripMember[];
  initialMeals: Meal[];
}) {
  const { t } = useTranslations();
  const [meals, setMeals] = useState(initialMeals);
  const [title, setTitle] = useState("");
  const [dayLabel, setDayLabel] = useState(t("meals.defaultDay"));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDayLabel, setEditDayLabel] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("meals").select("*").eq("trip_id", tripId).order("created_at");
    if (data) setMeals(data as Meal[]);
  }, [tripId]);

  useRealtimeTable("meals", tripId, load);

  async function updateMeal(id: string, field: string, value: string | null) {
    const supabase = createClient();
    await supabase.from("meals").update({ [field]: value }).eq("id", id);
    load();
  }

  async function addMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const supabase = createClient();
    await supabase.from("meals").insert({
      trip_id: tripId,
      day_label: dayLabel,
      meal_type: "altro",
      title: title.trim(),
      menu: "",
    });
    setTitle("");
    load();
  }

  function startEdit(meal: Meal) {
    setEditingId(meal.id);
    setEditTitle(meal.title || meal.meal_type);
    setEditDayLabel(meal.day_label);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId || !editTitle.trim()) return;
    const supabase = createClient();
    await supabase.from("meals").update({
      title: editTitle.trim(),
      day_label: editDayLabel.trim() || t("common.general"),
    }).eq("id", editingId);
    setEditingId(null);
    load();
  }

  async function deleteMeal(id: string) {
    const supabase = createClient();
    await supabase.from("meals").delete().eq("id", id);
    if (editingId === id) setEditingId(null);
    load();
  }

  const memberName = (id: string | null) => members.find((m) => m.user_id === id)?.display_name ?? t("common.dash");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("meals.title")}
        description={t("meals.description")}
        icon={ChefHat}
        badge={t("meals.badge")}
      />

      <Card>
        <form onSubmit={addMeal} className="flex flex-col sm:flex-row gap-2">
          <Input value={dayLabel} onChange={(e) => setDayLabel(e.target.value)} placeholder={t("meals.dayPlaceholder")} className="w-full sm:w-28" />
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("meals.titlePlaceholder")} className="flex-1 min-w-0" />
          <Button type="submit" className="w-full sm:w-auto shrink-0"><Plus className="w-4 h-4" /></Button>
        </form>
      </Card>

      <div className="grid gap-4">
        {meals.map((meal) => (
          <Card key={meal.id}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
              {editingId === meal.id ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-2 min-w-0">
                  <Input value={editDayLabel} onChange={(e) => setEditDayLabel(e.target.value)} placeholder={t("meals.dayPlaceholder")} className="w-full sm:w-28 text-sm" />
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder={t("meals.mealTitlePlaceholder")} className="flex-1 min-w-0 text-sm" />
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ember uppercase">{meal.day_label}</p>
                  <h3 className="font-[family-name:var(--font-fraunces)] text-lg flex items-center gap-2 break-words">
                    <ChefHat className="w-4 h-4 text-ember" />
                    {meal.title || meal.meal_type}
                  </h3>
                </div>
              )}
              {editingId === meal.id ? (
                <ItemActions editing onEdit={() => {}} onDelete={() => deleteMeal(meal.id)} onSave={saveEdit} onCancel={cancelEdit} />
              ) : (
                <ItemActions onEdit={() => startEdit(meal)} onDelete={() => deleteMeal(meal.id)} />
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("meals.whatWeEat")}</Label>
                <Textarea value={meal.menu} onChange={(e) => updateMeal(meal.id, "menu", e.target.value)} placeholder={t("meals.whatWeEatPlaceholder")} className="min-h-[60px] text-sm" />
              </div>
              <div>
                <Label className="text-xs">{t("meals.ingredients")}</Label>
                <Textarea value={meal.ingredients} onChange={(e) => updateMeal(meal.id, "ingredients", e.target.value)} placeholder={t("meals.ingredientsPlaceholder")} className="min-h-[60px] text-sm" />
              </div>
              <div>
                <Label className="text-xs">{t("meals.whoCooks")}</Label>
                <Select value={meal.cook ?? ""} onChange={(e) => updateMeal(meal.id, "cook", e.target.value || null)} className="text-sm">
                  <option value="">{t("common.dash")}</option>
                  {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t("meals.whoBrings")}</Label>
                <Select value={meal.who_brings ?? ""} onChange={(e) => updateMeal(meal.id, "who_brings", e.target.value || null)} className="text-sm">
                  <option value="">{t("common.dash")}</option>
                  {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">{t("meals.linkedEquipment")}</Label>
                <Input value={meal.equipment_needed} onChange={(e) => updateMeal(meal.id, "equipment_needed", e.target.value)} placeholder={t("meals.equipmentPlaceholder")} />
              </div>
            </div>
            {(meal.cook || meal.who_brings) && (
              <p className="text-xs text-cream/40 mt-2">
                {meal.cook && t("common.cookLabel", { name: memberName(meal.cook) })}
                {meal.cook && meal.who_brings && " · "}
                {meal.who_brings && t("common.bringsLabel", { name: memberName(meal.who_brings) })}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
