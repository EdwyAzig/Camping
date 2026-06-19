export function parseQuantityCount(quantity: string | number | null | undefined): number {
  if (quantity == null) return 1;
  const n = typeof quantity === "number" ? quantity : parseInt(String(quantity).trim(), 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function calcLineTotal(
  quantity: string | number | null | undefined,
  unitPrice: number | null | undefined
): number | null {
  if (unitPrice == null || !Number.isFinite(unitPrice)) return null;
  return parseQuantityCount(quantity) * unitPrice;
}

export function deriveUnitPrice(
  quantity: string | number | null | undefined,
  totalPrice: number | null | undefined
): number | null {
  if (totalPrice == null || !Number.isFinite(totalPrice)) return null;
  const count = parseQuantityCount(quantity);
  return Math.round((totalPrice / count) * 100) / 100;
}
