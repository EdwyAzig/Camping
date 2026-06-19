import { NextResponse } from "next/server";
import { emptyOffProduct, fetchOffProduct } from "@/lib/open-food-facts";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const { barcode } = await params;
  const cleaned = barcode.replace(/\D/g, "");

  if (cleaned.length < 8 || cleaned.length > 14) {
    return NextResponse.json({ error: "Barcode non valido" }, { status: 400 });
  }

  const product = await fetchOffProduct(cleaned);
  if (!product) {
    return NextResponse.json(emptyOffProduct(cleaned));
  }

  return NextResponse.json(product);
}
