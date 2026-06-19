const FOOD_TYPE_IT: Record<string, string> = {
  pasta: "Pasta",
  pastas: "Pasta",
  noodles: "Pasta",
  dairy: "Latticini",
  "dairy-products": "Latticini",
  cheeses: "Formaggi",
  cheese: "Formaggio",
  yogurts: "Yogurt",
  yogurt: "Yogurt",
  milk: "Latte",
  beverages: "Bevande",
  drinks: "Bevande",
  waters: "Acque",
  water: "Acqua",
  juices: "Succhi",
  juice: "Succo",
  snacks: "Snack",
  "sweet-snacks": "Snack dolci",
  "salty-snacks": "Snack salati",
  biscuits: "Biscotti",
  cookies: "Biscotti",
  chocolates: "Cioccolato",
  chocolate: "Cioccolato",
  breads: "Pane",
  bread: "Pane",
  cereals: "Cereali",
  cereal: "Cereali",
  meats: "Carni",
  meat: "Carne",
  "frozen-foods": "Surgelati",
  "plant-based-foods": "Alimenti vegetali",
  fruits: "Frutta",
  fruit: "Frutta",
  vegetables: "Verdura",
  vegetable: "Verdura",
  sauces: "Salse",
  sauce: "Salsa",
  spreads: "Creme spalmabili",
  "breakfast-cereals": "Cereali da colazione",
  pizzas: "Pizza",
  pizza: "Pizza",
  rice: "Riso",
  oils: "Oli",
  oil: "Olio",
  fish: "Pesce",
  seafood: "Pesce",
  eggs: "Uova",
  egg: "Uova",
  honey: "Miele",
  jams: "Marmellate",
  jam: "Marmellata",
  coffee: "Caffè",
  teas: "Tè",
  tea: "Tè",
  beers: "Birre",
  beer: "Birra",
  wines: "Vini",
  wine: "Vino",
  "canned-foods": "Conserve",
  soups: "Zuppe",
  soup: "Zuppa",
  desserts: "Dolci",
  dessert: "Dolce",
  ice: "Gelati",
  "ice-cream": "Gelato",
  chips: "Patatine",
  crackers: "Crackers",
  nuts: "Frutta secca",
  seeds: "Semi",
  spices: "Spezie",
  spice: "Spezie",
  condiments: "Condimenti",
  vinegar: "Aceto",
  salt: "Sale",
  sugar: "Zucchero",
  flour: "Farina",
  "cooking-ingredients": "Ingredienti da cucina",
};

export function translateFoodType(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, "-");
  if (FOOD_TYPE_IT[key]) return FOOD_TYPE_IT[key];
  const partial = Object.entries(FOOD_TYPE_IT).find(([en]) => key.includes(en));
  return partial?.[1] ?? null;
}

export function tagToLabel(tag: string): string {
  const lang = tag.split(":")[0];
  const label = tag.split(":").pop()?.replace(/-/g, " ").trim() ?? "";
  if (!label || label.length < 3) return "";
  if (["en", "fr", "de", "es", "world"].includes(lang)) {
    const translated = translateFoodType(label);
    if (translated) return translated;
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function looksItalian(text: string): boolean {
  if (/[àèéìòù]/i.test(text)) return true;
  return /\b(pasta|latte|acqua|pane|formaggio|yogurt|olio|riso|carne|pesce|frutta|verdura|bevanda|biscotti|cioccolato|marmellata|zucchero|sale|farina|salsa|snack|gelato|birra|vino|caffè|tè|gusto|classico|integrale|bio|naturale|fresco|italiano|italiana)\b/i.test(
    text
  );
}
