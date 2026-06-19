"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Card, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ItemActions } from "@/components/ui/ItemActions";
import { StatCard } from "@/components/ui/Progress";
import { calcFinance } from "@/lib/finance";
import { formatEuro } from "@/lib/utils";
import type { TripPayment, TripMember, Trip, ShoppingItem, Activity } from "@/lib/types";

export function CassaPageContent({
  trip,
  tripId,
  members,
  initialPayments,
  initialShopping,
  initialActivities,
}: {
  trip: Trip;
  tripId: string;
  members: TripMember[];
  initialPayments: TripPayment[];
  initialShopping: ShoppingItem[];
  initialActivities: Activity[];
}) {
  const [payments, setPayments] = useState(initialPayments);
  const [shopping, setShopping] = useState(initialShopping);
  const [activities, setActivities] = useState(initialActivities);
  const [tripState, setTripState] = useState(trip);
  const [userId, setUserId] = useState(members[0]?.user_id ?? "");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editLabel, setEditLabel] = useState("");

  const loadPayments = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("trip_payments")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });
    if (data) setPayments(data as TripPayment[]);
  }, [tripId]);

  const loadFinanceData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: shop }, { data: act }, { data: tripData }] = await Promise.all([
      supabase.from("shopping_items").select("*").eq("trip_id", tripId),
      supabase.from("activities").select("*").eq("trip_id", tripId),
      supabase.from("trips").select("*").eq("id", tripId).single(),
    ]);
    if (shop) setShopping(shop as ShoppingItem[]);
    if (act) setActivities(act as Activity[]);
    if (tripData) setTripState(tripData as Trip);
  }, [tripId]);

  useRealtimeTable("trip_payments", tripId, loadPayments);
  useRealtimeTable("shopping_items", tripId, loadFinanceData);
  useRealtimeTable("activities", tripId, loadFinanceData);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`trips-finance-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips", filter: `id=eq.${tripId}` },
        () => loadFinanceData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, loadFinanceData]);

  const finance = useMemo(
    () => calcFinance(tripState, members, shopping, activities, payments),
    [tripState, members, shopping, activities, payments]
  );

  const liveBalances = useMemo(() => {
    return members.map((m) => {
      const paid = payments
        .filter((p) => p.user_id === m.user_id)
        .reduce((s, p) => s + Number(p.amount), 0);
      const balance = paid - finance.perPerson;
      return { ...m, paid, balance };
    });
  }, [payments, members, finance.perPerson]);

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !amount) return;
    const supabase = createClient();
    await supabase.from("trip_payments").insert({
      trip_id: tripId,
      user_id: userId,
      amount: parseFloat(amount),
      label: label.trim(),
    });
    setAmount("");
    setLabel("");
    loadPayments();
  }

  function startEdit(payment: TripPayment) {
    setEditingId(payment.id);
    setEditUserId(payment.user_id);
    setEditAmount(String(payment.amount));
    setEditLabel(payment.label);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId || !editUserId || !editAmount) return;
    const supabase = createClient();
    await supabase
      .from("trip_payments")
      .update({
        user_id: editUserId,
        amount: parseFloat(editAmount),
        label: editLabel.trim(),
      })
      .eq("id", editingId);
    setEditingId(null);
    loadPayments();
  }

  async function deletePayment(id: string) {
    const supabase = createClient();
    await supabase.from("trip_payments").delete().eq("id", id);
    if (editingId === id) setEditingId(null);
    loadPayments();
  }

  const name = (id: string) => members.find((m) => m.user_id === id)?.display_name ?? "?";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cassa comune"
        description="Chi ha anticipato, chi deve rimborsare"
        icon={Wallet}
        badge="Finanze"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 animate-fade-up">
        <StatCard label="Totale stimato" value={formatEuro(finance.grandTotal)} accent />
        <StatCard label="Spesa" value={formatEuro(finance.shoppingTotal)} />
        <StatCard label="Attività + location" value={formatEuro(finance.activitiesTotal + finance.locationTotal)} />
        <StatCard label="A testa" value={formatEuro(finance.perPerson)} accent />
      </div>

      <Card gradient className="animate-fade-up animate-fade-up-delay-1">
        <CardTitle className="text-base mb-4">Saldi del gruppo</CardTitle>
        <ul className="space-y-3">
          {liveBalances.map((b) => (
            <li key={b.user_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-glass-border last:border-0">
              <div className="min-w-0">
                <p className="font-medium">{b.display_name}</p>
                <p className="text-xs text-cream/50">Anticipato {formatEuro(b.paid)} · Quota {formatEuro(finance.perPerson)}</p>
              </div>
              <div className={`flex items-center gap-1 text-sm font-semibold shrink-0 ${b.balance >= 0 ? "text-green-400" : "text-red-300"}`}>
                {b.balance >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {b.balance >= 0
                  ? `Riceve ${formatEuro(b.balance)}`
                  : `Deve ${formatEuro(Math.abs(b.balance))}`}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle className="text-base mb-4">Registra un pagamento</CardTitle>
        <form onSubmit={addPayment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <Label>Chi ha pagato</Label>
            <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Importo €</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div>
            <Label>Per cosa</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Spesa, griglia..." />
          </div>
          <Button type="submit" className="w-full sm:w-auto"><Plus className="w-4 h-4" /> Aggiungi</Button>
        </form>
      </Card>

      {payments.length > 0 && (
        <Card>
          <CardTitle className="text-base mb-3">Storico pagamenti</CardTitle>

          {/* Mobile cards */}
          <ul className="md:hidden space-y-2">
            {payments.map((p) => (
              <li key={p.id} className="mobile-item-card rounded-xl border border-glass-border bg-night/30">
                {editingId === p.id ? (
                  <div className="space-y-2">
                    <Select value={editUserId} onChange={(e) => setEditUserId(e.target.value)} className="text-sm">
                      {members.map((m) => (
                        <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
                      ))}
                    </Select>
                    <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="text-sm" placeholder="Per cosa" />
                    <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="text-sm" placeholder="Importo €" />
                    <div className="flex justify-end">
                      <ItemActions editing onEdit={() => {}} onDelete={() => deletePayment(p.id)} onSave={saveEdit} onCancel={cancelEdit} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{name(p.user_id)}</p>
                      <p className="text-sm text-cream/70 truncate">{p.label || "—"}</p>
                      <p className="text-ember font-medium mt-1">{formatEuro(Number(p.amount))}</p>
                    </div>
                    <ItemActions onEdit={() => startEdit(p)} onDelete={() => deletePayment(p.id)} />
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cream/50 border-b border-glass-border">
                  <th className="text-left py-2">Chi</th>
                  <th className="text-left py-2">Cosa</th>
                  <th className="text-right py-2">€</th>
                  <th className="text-right py-2 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-glass-border/50">
                    {editingId === p.id ? (
                      <>
                        <td className="py-2 pr-2">
                          <Select value={editUserId} onChange={(e) => setEditUserId(e.target.value)} className="text-sm">
                            {members.map((m) => (
                              <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
                            ))}
                          </Select>
                        </td>
                        <td className="py-2 pr-2">
                          <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="text-sm" />
                        </td>
                        <td className="py-2 pr-2">
                          <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="text-sm text-right" />
                        </td>
                        <td className="py-2 text-right">
                          <ItemActions
                            editing
                            onEdit={() => {}}
                            onDelete={() => deletePayment(p.id)}
                            onSave={saveEdit}
                            onCancel={cancelEdit}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2">{name(p.user_id)}</td>
                        <td className="py-2 text-cream/70">{p.label || "—"}</td>
                        <td className="py-2 text-right text-ember">{formatEuro(Number(p.amount))}</td>
                        <td className="py-2 text-right">
                          <ItemActions
                            onEdit={() => startEdit(p)}
                            onDelete={() => deletePayment(p.id)}
                          />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
