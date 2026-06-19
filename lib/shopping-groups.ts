import type { TFunction } from "@/lib/i18n/translate";
import type { ShoppingGroup, ShoppingItem } from "@/lib/types";

export function getGroupLabel(
  groupId: string | null | undefined,
  groups: ShoppingGroup[],
  t: TFunction
): string {
  if (!groupId) return t("shopping.groupNone");
  return groups.find((g) => g.id === groupId)?.name ?? t("shopping.groupNone");
}

export function getGroupOptions(groups: ShoppingGroup[], t: TFunction) {
  return [
    { value: "", label: t("shopping.groupNone") },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];
}

export function groupItemsByShoppingGroup(
  items: ShoppingItem[],
  groups: ShoppingGroup[],
  t: TFunction
): { key: string | null; label: string; items: ShoppingItem[] }[] {
  const order = new Map(groups.map((g, i) => [g.id, i]));
  const map = new Map<string | null, ShoppingItem[]>();

  for (const item of items) {
    const key = item.group_id ?? null;
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }

  return [...map.entries()]
    .sort(([a], [b]) => {
      if (a === b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      return (order.get(a) ?? 999) - (order.get(b) ?? 999);
    })
    .map(([key, groupItems]) => ({
      key,
      label: getGroupLabel(key, groups, t),
      items: groupItems,
    }));
}
