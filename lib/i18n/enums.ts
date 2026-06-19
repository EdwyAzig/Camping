import type { ActivityDifficulty, MealType, ShoppingCategory, TripPhase } from "@/lib/types";
import type { Locale } from "./config";
import type { TFunction } from "./translate";

export function getShoppingCategoryOptions(t: TFunction) {
  return [
    { value: "cibo" as ShoppingCategory, label: t("enums.shoppingCategory.cibo") },
    { value: "bevande" as ShoppingCategory, label: t("enums.shoppingCategory.bevande") },
    { value: "altro" as ShoppingCategory, label: t("enums.shoppingCategory.altro") },
  ];
}

export function getMealTypeOptions(t: TFunction) {
  const types: MealType[] = [
    "colazione",
    "pranzo",
    "cena",
    "aperitivo",
    "cena_speciale",
    "notte",
    "altro",
  ];
  return types.map((value) => ({
    value,
    label: t(`enums.mealType.${value}`),
  }));
}

export function getTripPhaseOptions(t: TFunction) {
  const phases: TripPhase[] = ["partenza", "soggiorno", "ritorno", "generale"];
  return phases.map((value) => ({
    value,
    label: t(`enums.tripPhase.${value}`),
  }));
}

export function getActivityDifficultyOptions(t: TFunction) {
  const levels: ActivityDifficulty[] = ["facile", "media", "difficile"];
  return levels.map((value) => ({
    value,
    label: t(`enums.activityDifficulty.${value}`),
  }));
}

export function getPhaseLabel(phase: TripPhase, t: TFunction): string {
  return t(`enums.tripPhase.${phase}`);
}

export function getShoppingCategoryLabel(category: ShoppingCategory, t: TFunction): string {
  return t(`enums.shoppingCategory.${category}`);
}

export function getMealTypeLabel(type: MealType, t: TFunction): string {
  return t(`enums.mealType.${type}`);
}

export function getDifficultyLabel(difficulty: ActivityDifficulty, t: TFunction): string {
  return t(`enums.activityDifficulty.${difficulty}`);
}

export function getLocaleLabel(locale: Locale, t: TFunction): string {
  return t(`settings.localeNames.${locale}`);
}
