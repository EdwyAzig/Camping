import { tagToLabel, translateFoodType } from "./food-translations";
import type { ShoppingCategory } from "./types";

export interface OffProduct {
  barcode: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  foodType: string | null;
  packSize: string | null;
  quantity: string;
  category: ShoppingCategory;
  found?: boolean;
}

interface OffApiProduct {
  code?: string;
  product_name?: string;
  product_name_it?: string;
  generic_name?: string;
  generic_name_it?: string;
  brands?: string;
  image_front_small_url?: string;
  image_front_url?: string;
  image_small_url?: string;
  image_thumb_url?: string;
  image_url?: string;
  quantity?: string;
  categories_tags?: string[];
}

interface OffApiResponse {
  status?: number;
  product?: OffApiProduct;
}

const OFF_FIELDS =
  "code,product_name,product_name_it,generic_name,generic_name_it,brands,image_front_small_url,image_front_url,image_small_url,image_thumb_url,image_url,quantity,categories_tags";

function pickStr(...values: (string | undefined | null)[]): string | null {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return null;
}

function mergeProducts(world?: OffApiProduct, it?: OffApiProduct): OffApiProduct {
  return {
    product_name_it: pickStr(it?.product_name_it, it?.product_name) ?? undefined,
    product_name: pickStr(
      it?.product_name_it,
      it?.product_name,
      world?.product_name_it,
      world?.product_name,
      world?.generic_name,
      it?.generic_name
    ) ?? undefined,
    generic_name_it: pickStr(it?.generic_name_it, it?.generic_name) ?? undefined,
    generic_name: pickStr(world?.generic_name, it?.generic_name) ?? undefined,
    brands: pickStr(world?.brands, it?.brands) ?? undefined,
    image_front_small_url: pickStr(
      world?.image_front_small_url,
      it?.image_front_small_url,
      world?.image_front_url,
      it?.image_front_url,
      world?.image_small_url,
      it?.image_small_url,
      world?.image_thumb_url,
      it?.image_thumb_url,
      world?.image_url,
      it?.image_url
    ) ?? undefined,
    image_url: pickStr(world?.image_url, it?.image_url) ?? undefined,
    quantity: pickStr(world?.quantity, it?.quantity) ?? undefined,
    categories_tags: it?.categories_tags?.length
      ? it.categories_tags
      : world?.categories_tags,
  };
}

export function mapOffCategory(categoriesTags: string[] | undefined): ShoppingCategory {
  if (!categoriesTags?.length) return "cibo";
  const joined = categoriesTags.join(" ").toLowerCase();
  if (
    joined.includes("bevande") ||
    joined.includes("beverage") ||
    joined.includes("drink") ||
    joined.includes("water") ||
    joined.includes("acqua") ||
    joined.includes("juice") ||
    joined.includes("beer") ||
    joined.includes("wine") ||
    joined.includes("birra") ||
    joined.includes("vino") ||
    joined.includes("soft-drink") ||
    joined.includes("soda")
  ) {
    return "bevande";
  }
  if (
    joined.includes("food") ||
    joined.includes("cibi") ||
    joined.includes("snack") ||
    joined.includes("dairy") ||
    joined.includes("latticini") ||
    joined.includes("meat") ||
    joined.includes("carne") ||
    joined.includes("pasta")
  ) {
    return "cibo";
  }
  return "altro";
}

export function extractFoodType(categoriesTags: string[] | undefined): string | null {
  if (!categoriesTags?.length) return null;

  const itTag = categoriesTags.find((t) => t.startsWith("it:"));
  if (itTag) {
    const label = tagToLabel(itTag);
    if (label) return label;
  }

  for (const tag of categoriesTags) {
    if (tag.startsWith("en:")) {
      const label = tagToLabel(tag);
      if (label) return label;
    }
  }

  for (const tag of categoriesTags.slice(0, 8)) {
    const label = tagToLabel(tag);
    if (label && !["Aliments", "Products", "Foods"].includes(label)) return label;
  }

  return null;
}

function pickProductName(p: OffApiProduct, barcode: string): string {
  const raw = pickStr(
    p.product_name_it,
    p.product_name,
    p.generic_name_it,
    p.generic_name
  );
  if (raw) {
    const translated = translateFoodType(raw.toLowerCase());
    return translated && translated !== raw.toLowerCase() ? translated : raw;
  }
  const brand = p.brands?.split(",")[0]?.trim();
  if (brand) return brand;
  return `Prodotto ${barcode}`;
}

export function parseOffProduct(barcode: string, data: OffApiResponse): OffProduct | null {
  if (data.status !== 1 || !data.product) return null;
  const p = data.product;
  const name = pickProductName(p, barcode);
  const packSize = p.quantity?.trim() || null;

  return {
    barcode,
    name,
    brand: p.brands?.split(",")[0]?.trim() || null,
    imageUrl: pickStr(p.image_front_small_url, p.image_url),
    foodType: extractFoodType(p.categories_tags),
    packSize,
    quantity: "1",
    category: mapOffCategory(p.categories_tags),
    found: true,
  };
}

async function fetchOffEndpoint(baseUrl: string, barcode: string): Promise<OffApiResponse | null> {
  try {
    const res = await fetch(
      `${baseUrl}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${OFF_FIELDS}`,
      {
        headers: { "User-Agent": "CampingOrganizer/1.0 (camping trip shopping list)" },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as OffApiResponse;
  } catch {
    return null;
  }
}

const OFF_MIRRORS = [
  "https://it.openfoodfacts.org",
  "https://world.openfoodfacts.org",
  "https://at.openfoodfacts.org",
  "https://de.openfoodfacts.org",
  "https://fr.openfoodfacts.org",
];

export async function fetchOffProduct(barcode: string): Promise<OffProduct | null> {
  const results = await Promise.all(OFF_MIRRORS.map((base) => fetchOffEndpoint(base, barcode)));
  const hits = results.filter((r) => r?.status === 1 && r.product);

  if (!hits.length) return null;

  let merged: OffApiProduct = {};
  for (const hit of hits) {
    merged = mergeProducts(merged, hit!.product);
  }

  return parseOffProduct(barcode, { status: 1, product: merged });
}

/** Per fallback client-side se l'API non risponde */
export function emptyOffProduct(barcode: string): OffProduct {
  return {
    barcode,
    name: "",
    brand: null,
    imageUrl: null,
    foodType: null,
    packSize: null,
    quantity: "1",
    category: "cibo",
    found: false,
  };
}

export async function lookupBarcodeProduct(barcode: string): Promise<OffProduct> {
  const cleaned = barcode.replace(/\D/g, "");
  const empty = emptyOffProduct(cleaned);

  try {
    const res = await fetch(`/api/products/${cleaned}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as OffProduct;
      if (data.found !== false && (data.name || data.imageUrl)) return data;
    }
  } catch {
    // prova diretto sotto
  }

  try {
    const direct = await fetchOffProduct(cleaned);
    if (direct) return direct;
  } catch {
    // ignora
  }

  return empty;
}
