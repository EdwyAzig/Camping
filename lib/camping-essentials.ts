export type EssentialItem = {
  id: string;
  nameKey: string;
  detailKey: string;
  critical?: boolean;
};

export type EssentialCategory = {
  id: string;
  titleKey: string;
  items: EssentialItem[];
};

export type EssentialScope = "group" | "personal";

export type EssentialSection = {
  scope: EssentialScope;
  scopeTitleKey: string;
  categories: EssentialCategory[];
};

export const CAMPING_ESSENTIALS: EssentialSection[] = [
  {
    scope: "group",
    scopeTitleKey: "equipment.essentials.scopeGroup",
    categories: [
      {
        id: "groupFire",
        titleKey: "equipment.essentials.categoryGroupFire",
        items: [
          { id: "charcoal", nameKey: "equipment.essentials.itemCharcoal", detailKey: "equipment.essentials.itemCharcoalDetail", critical: true },
          { id: "firestarter", nameKey: "equipment.essentials.itemFirestarter", detailKey: "equipment.essentials.itemFirestarterDetail", critical: true },
          { id: "lighter", nameKey: "equipment.essentials.itemLighter", detailKey: "equipment.essentials.itemLighterDetail", critical: true },
          { id: "tongs", nameKey: "equipment.essentials.itemTongs", detailKey: "equipment.essentials.itemTongsDetail" },
          { id: "knife", nameKey: "equipment.essentials.itemKnife", detailKey: "equipment.essentials.itemKnifeDetail" },
          { id: "cuttingBoard", nameKey: "equipment.essentials.itemCuttingBoard", detailKey: "equipment.essentials.itemCuttingBoardDetail" },
          { id: "foil", nameKey: "equipment.essentials.itemFoil", detailKey: "equipment.essentials.itemFoilDetail" },
          { id: "cooler", nameKey: "equipment.essentials.itemCooler", detailKey: "equipment.essentials.itemCoolerDetail" },
        ],
      },
      {
        id: "groupTable",
        titleKey: "equipment.essentials.categoryGroupTable",
        items: [
          { id: "disposables", nameKey: "equipment.essentials.itemDisposables", detailKey: "equipment.essentials.itemDisposablesDetail" },
          { id: "napkins", nameKey: "equipment.essentials.itemNapkins", detailKey: "equipment.essentials.itemNapkinsDetail" },
          { id: "paperTowels", nameKey: "equipment.essentials.itemPaperTowels", detailKey: "equipment.essentials.itemPaperTowelsDetail" },
          { id: "trashBags", nameKey: "equipment.essentials.itemTrashBags", detailKey: "equipment.essentials.itemTrashBagsDetail" },
          { id: "handSoap", nameKey: "equipment.essentials.itemHandSoap", detailKey: "equipment.essentials.itemHandSoapDetail" },
          { id: "sponge", nameKey: "equipment.essentials.itemSponge", detailKey: "equipment.essentials.itemSpongeDetail" },
          { id: "toiletPaper", nameKey: "equipment.essentials.itemToiletPaper", detailKey: "equipment.essentials.itemToiletPaperDetail" },
        ],
      },
    ],
  },
  {
    scope: "personal",
    scopeTitleKey: "equipment.essentials.scopePersonal",
    categories: [
      {
        id: "personalBasics",
        titleKey: "equipment.essentials.categoryPersonalBasics",
        items: [
          { id: "bugSpray", nameKey: "equipment.essentials.itemBugSpray", detailKey: "equipment.essentials.itemBugSprayDetail" },
          { id: "flashlight", nameKey: "equipment.essentials.itemFlashlight", detailKey: "equipment.essentials.itemFlashlightDetail" },
          { id: "powerBank", nameKey: "equipment.essentials.itemPowerBank", detailKey: "equipment.essentials.itemPowerBankDetail" },
          { id: "wetWipes", nameKey: "equipment.essentials.itemWetWipes", detailKey: "equipment.essentials.itemWetWipesDetail" },
        ],
      },
      {
        id: "personalHealth",
        titleKey: "equipment.essentials.categoryPersonalHealth",
        items: [
          { id: "bandages", nameKey: "equipment.essentials.itemBandages", detailKey: "equipment.essentials.itemBandagesDetail" },
          { id: "painRelief", nameKey: "equipment.essentials.itemPainRelief", detailKey: "equipment.essentials.itemPainReliefDetail", critical: true },
        ],
      },
    ],
  },
];

export function getEssentialsByScope(scope: EssentialScope): EssentialSection {
  const section = CAMPING_ESSENTIALS.find((entry) => entry.scope === scope);
  if (!section) throw new Error(`Missing essentials scope: ${scope}`);
  return section;
}

export function isCustomPackingKey(itemKey: string) {
  return itemKey.startsWith("custom:");
}

export function newCustomPackingKey() {
  return `custom:${crypto.randomUUID()}`;
}
