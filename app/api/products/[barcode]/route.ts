import { NextResponse } from "next/server";
import { emptyOffProduct, fetchOffProduct } from "@/lib/open-food-facts";
import { getLocale } from "@/lib/i18n/server";
import { getTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const { barcode } = await params;
  const cleaned = barcode.replace(/\D/g, "");
  const t = await getTranslations();
  const locale = await getLocale();

  if (cleaned.length < 8 || cleaned.length > 14) {
    return NextResponse.json({ error: t("errors.invalidBarcode") }, { status: 400 });
  }

  const product = await fetchOffProduct(cleaned, locale);
  if (!product) {
    return NextResponse.json(emptyOffProduct(cleaned));
  }

  return NextResponse.json(product);
}
