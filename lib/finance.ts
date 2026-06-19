import { countNights } from "./dates";
import { calcLineTotal } from "./shopping-utils";
import type { Trip, ShoppingItem, Equipment, Activity, TripPayment, TripMember, FinanceSummary } from "./types";

function lineEstimate(item: ShoppingItem): number {
  return item.estimated_price ?? calcLineTotal(item.quantity, item.unit_price) ?? 0;
}

export function calcPitchCost(trip: Trip): number {
  const perNight = trip.pitch_cost_per_night ?? 0;
  if (!perNight) return 0;
  const nights = countNights(trip.start_date, trip.end_date);
  return nights > 0 ? perNight * nights : perNight;
}

export function calcLocationTotal(trip: Trip): number {
  return (
    (trip.table_cost ?? 0) +
    (trip.grill_rental_cost ?? 0) +
    (trip.parking_cost ?? 0) +
    calcPitchCost(trip) +
    (trip.other_location_cost ?? 0)
  );
}

export function calcFinance(
  trip: Trip,
  members: TripMember[],
  shopping: ShoppingItem[],
  activities: Activity[],
  payments: TripPayment[]
): FinanceSummary {
  const shoppingTotal = shopping.reduce((s, i) => {
    const line = lineEstimate(i);
    if (i.bought) return s + (i.actual_price ?? line);
    return s + line;
  }, 0);
  const activitiesTotal = activities.reduce((s, a) => s + (a.estimated_cost ?? 0), 0);
  const locationTotal = calcLocationTotal(trip);
  const grandTotal = shoppingTotal + activitiesTotal + locationTotal;
  const count = Math.max(members.length, 1);
  const perPerson = grandTotal / count;

  const memberBalances = members.map((m) => {
    const paid = payments
      .filter((p) => p.user_id === m.user_id)
      .reduce((s, p) => s + Number(p.amount), 0);
    const balance = paid - perPerson;
    return {
      userId: m.user_id,
      displayName: m.display_name,
      paid,
      share: perPerson,
      balance,
    };
  });

  return { shoppingTotal, activitiesTotal, locationTotal, grandTotal, perPerson, memberBalances };
}

export function calcShoppingProgress(items: ShoppingItem[]) {
  if (!items.length) return 0;
  return Math.round((items.filter((i) => i.bought).length / items.length) * 100);
}

export function calcShoppingPaid(items: ShoppingItem[]) {
  return items
    .filter((i) => i.bought)
    .reduce((s, i) => s + (i.actual_price ?? lineEstimate(i)), 0);
}

export function calcShoppingRemaining(items: ShoppingItem[]) {
  return items
    .filter((i) => !i.bought)
    .reduce((s, i) => s + lineEstimate(i), 0);
}

export function calcEquipmentProgress(items: Equipment[]) {
  if (!items.length) return 0;
  return Math.round((items.filter((i) => i.confirmed).length / items.length) * 100);
}

export function getUrgentItems(equipment: Equipment[], shopping: ShoppingItem[]) {
  const urgent: { label: string; type: "equipment" | "shopping" }[] = [];

  equipment
    .filter((e) => e.critical && !e.confirmed)
    .forEach((e) => urgent.push({ label: e.item_name, type: "equipment" }));

  const criticalNames = ["griglia", "acqua", "tenda", "primo soccorso", "kit primo soccorso"];
  shopping
    .filter((s) => !s.bought && criticalNames.some((n) => s.name.toLowerCase().includes(n)))
    .forEach((s) => urgent.push({ label: s.name, type: "shopping" }));

  return urgent;
}
