import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";
import { addDays, dayLabelFromDate, defaultWeekendDates, formatDateShort } from "./dates";

export async function seedTripDefaults(
  tripId: string,
  supabase: SupabaseClient,
  locale: Locale = "it"
) {
  const t = createTranslator(getMessages(locale));
  const { start, end } = defaultWeekendDates();
  const general = t("common.general");

  const schedule = [
    {
      trip_id: tripId,
      day_label: general,
      event_date: null,
      time_note: "",
      description: t("seed.scheduleDepartureNatural"),
      entry_type: "natural",
      phase: "partenza",
      sort_order: 0,
    },
    {
      trip_id: tripId,
      day_label: general,
      event_date: null,
      time_note: "",
      description: t("seed.scheduleReturnNatural"),
      entry_type: "natural",
      phase: "ritorno",
      sort_order: 1,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(start, locale),
      event_date: start,
      time_note: "18:15",
      description: t("seed.scheduleMeetDeparture"),
      entry_type: "timeline",
      phase: "partenza",
      sort_order: 10,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(start, locale),
      event_date: start,
      time_note: "19:00",
      description: t("seed.scheduleArriveCamp"),
      entry_type: "timeline",
      phase: "soggiorno",
      sort_order: 11,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(start, locale),
      event_date: start,
      time_note: "19:30",
      description: t("seed.scheduleSetupTents"),
      entry_type: "timeline",
      phase: "soggiorno",
      sort_order: 12,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(start, locale),
      event_date: start,
      time_note: "20:30",
      description: t("seed.scheduleGrill"),
      entry_type: "timeline",
      phase: "soggiorno",
      sort_order: 13,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(start, locale),
      event_date: start,
      time_note: "23:00",
      description: t("seed.scheduleChillFire"),
      entry_type: "timeline",
      phase: "soggiorno",
      sort_order: 14,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(end, locale),
      event_date: end,
      time_note: t("schedule.timeMorning"),
      description: t("seed.scheduleHike"),
      entry_type: "timeline",
      phase: "soggiorno",
      sort_order: 20,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(end, locale),
      event_date: end,
      time_note: "13:00",
      description: t("seed.scheduleLunchCleanup"),
      entry_type: "timeline",
      phase: "soggiorno",
      sort_order: 21,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(end, locale),
      event_date: end,
      time_note: "14:30",
      description: t("seed.scheduleReturnHome"),
      entry_type: "timeline",
      phase: "ritorno",
      sort_order: 30,
    },
  ];

  await supabase.from("schedule_entries").insert(schedule);

  const meals = [
    {
      trip_id: tripId,
      day_label: t("seed.mealSunday"),
      meal_type: "aperitivo",
      title: t("seed.mealAperitivoTitle"),
      menu: t("seed.mealAperitivoMenu"),
      ingredients: t("seed.mealAperitivoIngredients"),
      equipment_needed: t("seed.mealAperitivoEquipment"),
    },
    {
      trip_id: tripId,
      day_label: t("seed.mealSunday"),
      meal_type: "cena",
      title: t("seed.mealGrillTitle"),
      menu: t("seed.mealGrillMenu"),
      ingredients: t("seed.mealGrillIngredients"),
      equipment_needed: t("seed.mealGrillEquipment"),
    },
    {
      trip_id: tripId,
      day_label: t("seed.mealSunday"),
      meal_type: "notte",
      title: t("seed.mealNightTitle"),
      menu: t("seed.mealNightMenu"),
      ingredients: t("seed.mealNightIngredients"),
      equipment_needed: t("seed.mealNightEquipment"),
    },
    {
      trip_id: tripId,
      day_label: t("seed.mealMonday"),
      meal_type: "pranzo",
      title: t("seed.mealLunchTitle"),
      menu: t("seed.mealLunchMenu"),
      ingredients: t("seed.mealLunchIngredients"),
      equipment_needed: t("seed.mealLunchEquipment"),
    },
  ];

  await supabase.from("meals").insert(meals);

  const equipment = [
    { trip_id: tripId, item_name: t("seed.equipGrill"), critical: true },
    { trip_id: tripId, item_name: t("seed.equipCharcoal"), critical: true },
    { trip_id: tripId, item_name: t("seed.equipLighter"), critical: true },
    { trip_id: tripId, item_name: t("seed.equipTongs"), critical: false },
    { trip_id: tripId, item_name: t("seed.equipTent"), critical: true },
    { trip_id: tripId, item_name: t("seed.equipSleepingBags"), critical: false },
    { trip_id: tripId, item_name: t("seed.equipTorches"), critical: false },
    { trip_id: tripId, item_name: t("seed.equipPowerbank"), critical: false },
    { trip_id: tripId, item_name: t("seed.equipFirstAid"), critical: true },
    { trip_id: tripId, item_name: t("seed.equipTrashBags"), critical: false },
    { trip_id: tripId, item_name: t("seed.equipBugSpray"), critical: false },
    { trip_id: tripId, item_name: t("seed.equipHoodies"), critical: false },
    { trip_id: tripId, item_name: t("seed.equipTowels"), critical: false },
    { trip_id: tripId, item_name: t("seed.equipBlankets"), critical: false },
  ];

  await supabase.from("equipment").insert(equipment);

  await supabase.from("activities").insert([
    {
      trip_id: tripId,
      name: t("seed.activityBeachVolley"),
      description: t("seed.activityBeachVolleyDesc"),
      estimated_cost: 0,
      event_date: end,
      scheduled_time: t("schedule.timeMorning"),
      phase: "soggiorno",
      difficulty: "facile",
    },
    {
      trip_id: tripId,
      name: t("seed.activitySunsetWalk"),
      description: t("seed.activitySunsetWalkDesc"),
      estimated_cost: 0,
      event_date: start,
      scheduled_time: "19:45",
      phase: "soggiorno",
      difficulty: "facile",
    },
    {
      trip_id: tripId,
      name: t("seed.activityCardGames"),
      description: t("seed.activityCardGamesDesc"),
      estimated_cost: 0,
      event_date: start,
      scheduled_time: "23:00",
      phase: "soggiorno",
      difficulty: "facile",
    },
    {
      trip_id: tripId,
      name: t("seed.activityPhotoChallenge"),
      description: t("seed.activityPhotoChallengeDesc"),
      estimated_cost: 0,
      event_date: start,
      scheduled_time: t("schedule.timeAllWeekend"),
      phase: "soggiorno",
      difficulty: "facile",
    },
    {
      trip_id: tripId,
      name: t("seed.activityCarPooling"),
      description: t("seed.activityCarPoolingDesc"),
      estimated_cost: 0,
      event_date: start,
      scheduled_time: "18:15",
      phase: "partenza",
      difficulty: "facile",
    },
  ]);

  await supabase
    .from("trips")
    .update({
      start_date: start,
      end_date: end,
      departure_date: formatDateShort(start, locale),
      return_note: formatDateShort(end, locale),
      address: t("defaults.locationRegion"),
      parking_notes: t("defaults.parkingNotes"),
      services: t("defaults.services"),
      table_cost: 0,
      grill_rental_cost: 15,
      parking_cost: 5,
      pitch_cost_per_night: 18,
      other_location_cost: 0,
      other_location_cost_label: "",
      contact_info: t("defaults.contactInfo"),
    })
    .eq("id", tripId);
}
