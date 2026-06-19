import type { ShoppingCategory } from "@/lib/types";

export interface ParsedListItem {
  name: string;
  quantity: number;
  category: ShoppingCategory;
}

const BULLET_RE = /^[\s]*(?:[-*•·–—]|\d+[.)]\s*)\s*/u;

const CATEGORY_PREFIX_RE = /^(cibo|bevande|altro)\s*[:–-]\s*(.+)$/i;

const QTY_PREFIX_RE = /^(\d{1,3})\s*[x×]\s*(.+)$/i;
const QTY_SUFFIX_RE = /^(.+?)\s*[x×]\s*(\d{1,3})$/i;
const QTY_PARENS_RE = /^(.+?)\s*\((\d{1,3})\)\s*$/;
const QTY_LEADING_RE = /^(\d{1,2})\s+(.+)$/;

const WEIGHT_UNIT_RE = /\d\s*(?:g|kg|ml|l|cl)\b/i;

const DRINK_KEYWORDS =
  /\b(acqua|birra|vino|succo|succhi|cola|aranciata|limonata|the|tè|caffè|caffe|latte|bevanda|bevande|spumante|prosecco|aperol|gin|vodka|whisky|rum)\b/i;

function stripBullet(line: string): string {
  return line.replace(BULLET_RE, "").trim();
}

function splitRawLines(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const byNewline = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (byNewline.length === 1 && /[,;]/.test(byNewline[0])) {
    return byNewline[0]
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return byNewline;
}

function inferCategory(name: string, explicit?: ShoppingCategory): ShoppingCategory {
  if (explicit) return explicit;
  return DRINK_KEYWORDS.test(name) ? "bevande" : "cibo";
}

function parseQuantityAndName(rest: string): { quantity: number; name: string } {
  let m = rest.match(QTY_PREFIX_RE);
  if (m) return { quantity: parseInt(m[1], 10), name: m[2].trim() };

  m = rest.match(QTY_SUFFIX_RE);
  if (m) return { quantity: parseInt(m[2], 10), name: m[1].trim() };

  m = rest.match(QTY_PARENS_RE);
  if (m) return { quantity: parseInt(m[2], 10), name: m[1].trim() };

  m = rest.match(QTY_LEADING_RE);
  if (m && !WEIGHT_UNIT_RE.test(rest)) {
    const qty = parseInt(m[1], 10);
    if (qty >= 1 && qty <= 99) return { quantity: qty, name: m[2].trim() };
  }

  return { quantity: 1, name: rest };
}

function capitalizeName(name: string): string {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function parseLine(line: string): ParsedListItem | null {
  const cleaned = stripBullet(line);
  if (!cleaned) return null;

  let explicitCategory: ShoppingCategory | undefined;
  let rest = cleaned;

  const catMatch = rest.match(CATEGORY_PREFIX_RE);
  if (catMatch) {
    explicitCategory = catMatch[1].toLowerCase() as ShoppingCategory;
    rest = catMatch[2].trim();
  }

  const { quantity, name } = parseQuantityAndName(rest);
  const trimmedName = name.replace(/\s+/g, " ").trim();
  if (!trimmedName || trimmedName.length < 2) return null;

  return {
    name: capitalizeName(trimmedName),
    quantity: Math.max(1, quantity),
    category: inferCategory(trimmedName, explicitCategory),
  };
}

export function parseShoppingListText(text: string): ParsedListItem[] {
  const seen = new Set<string>();
  const results: ParsedListItem[] = [];

  for (const line of splitRawLines(text)) {
    const item = parseLine(line);
    if (!item) continue;

    const key = `${item.name.toLowerCase()}|${item.quantity}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(item);
  }

  return results;
}
