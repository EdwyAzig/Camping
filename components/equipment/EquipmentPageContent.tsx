"use client";

import { useCallback, useState } from "react";
import { Plus, Check, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { ItemActions } from "@/components/ui/ItemActions";
import { cn } from "@/lib/utils";
import type { Equipment, TripMember } from "@/lib/types";

export function EquipmentPageContent({
  tripId,
  members,
  initialEquipment,
}: {
  tripId: string;
  members: TripMember[];
  initialEquipment: Equipment[];
}) {
  const [equipment, setEquipment] = useState(initialEquipment);
  const [newItem, setNewItem] = useState("");
  const [critical, setCritical] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("equipment").select("*").eq("trip_id", tripId).order("created_at");
    if (data) setEquipment(data as Equipment[]);
  }, [tripId]);

  useRealtimeTable("equipment", tripId, load);

  async function updateEquipment(id: string, updates: Partial<Equipment>) {
    const supabase = createClient();
    await supabase.from("equipment").update(updates).eq("id", id);
    load();
  }

  async function addEquipment(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    const supabase = createClient();
    await supabase.from("equipment").insert({ trip_id: tripId, item_name: newItem.trim(), critical });
    setNewItem("");
    setCritical(false);
    load();
  }

  function startEdit(item: Equipment) {
    setEditingId(item.id);
    setEditName(item.item_name);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return;
    await updateEquipment(editingId, { item_name: editName.trim() });
    setEditingId(null);
  }

  async function deleteEquipment(id: string) {
    const supabase = createClient();
    await supabase.from("equipment").delete().eq("id", id);
    if (editingId === id) setEditingId(null);
    load();
  }

  const criticalPending = equipment.filter((e) => e.critical && !e.confirmed);
  const ready = equipment.filter((e) => e.confirmed).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attrezzatura"
        description={`${ready}/${equipment.length} confermati${criticalPending.length > 0 ? ` · ${criticalPending.length} critici mancanti` : ""}`}
        icon={AlertTriangle}
        badge="Equip"
      />

      {criticalPending.length > 0 && (
        <Card className="border-red-500/30 bg-red-950/20 p-4">
          <CardTitle className="text-base flex items-center gap-2 text-red-200">
            <AlertTriangle className="w-4 h-4" /> Non dimenticare!
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            {criticalPending.map((e) => (
              <span key={e.id} className="px-3 py-1 rounded-full text-sm bg-red-900/40 border border-red-800/50">
                {e.item_name}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <form onSubmit={addEquipment} className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Es. griglia, tenda..." className="flex-1 min-w-0" />
          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-1.5 text-sm text-cream/60 cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={critical} onChange={(e) => setCritical(e.target.checked)} className="accent-ember" />
              Critico
            </label>
            <Button type="submit" size="sm"><Plus className="w-4 h-4" /></Button>
          </div>
        </form>
      </Card>

      <ul className="space-y-2">
        {equipment.map((item) => (
          <li key={item.id}>
            <Card className="p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => updateEquipment(item.id, { confirmed: !item.confirmed })}
                    className={cn("w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0", item.confirmed ? "bg-ember border-ember" : "border-cream/30")}
                  >
                    {item.confirmed && <Check className="w-3.5 h-3.5 text-night" />}
                  </button>
                  {editingId === item.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 min-w-0 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className={cn("flex-1 font-medium flex flex-wrap items-center gap-2 min-w-0 break-words", item.confirmed && "text-cream/50")}>
                      {item.item_name}
                      {item.critical && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-200 border border-red-800/50 flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3 h-3" /> Critico
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Select className="w-full sm:w-auto sm:min-w-[120px] text-sm py-1.5" value={item.assigned_to ?? ""} onChange={(e) => updateEquipment(item.id, { assigned_to: e.target.value || null })}>
                    <option value="">Chi porta?</option>
                    {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}
                  </Select>
                  <button onClick={() => updateEquipment(item.id, { critical: !item.critical })} className={cn("text-xs px-2 py-1 rounded-lg border whitespace-nowrap", item.critical ? "border-red-800 text-red-300" : "border-glass-border text-cream/40")}>
                    {item.critical ? "Critico" : "Normale"}
                  </button>
                  {editingId === item.id ? (
                    <ItemActions editing onEdit={() => {}} onDelete={() => deleteEquipment(item.id)} onSave={saveEdit} onCancel={cancelEdit} />
                  ) : (
                    <ItemActions onEdit={() => startEdit(item)} onDelete={() => deleteEquipment(item.id)} />
                  )}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
