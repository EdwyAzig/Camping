import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, dayLabelFromDate, defaultWeekendDates, formatItalianDateShort } from "./dates";

export async function seedTripDefaults(tripId: string, supabase: SupabaseClient) {
  const { start, end } = defaultWeekendDates();

  const schedule = [
    {
      trip_id: tripId,
      day_label: "Generale",
      event_date: null,
      time_note: "",
      description: "Partiamo domenica dopo le 18:00",
      entry_type: "natural",
      phase: "partenza",
      sort_order: 0,
    },
    {
      trip_id: tripId,
      day_label: "Generale",
      event_date: null,
      time_note: "",
      description: "Rientriamo lunedì dopo pranzo",
      entry_type: "natural",
      phase: "ritorno",
      sort_order: 1,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(start),
      event_date: start,
      time_note: "18:15",
      description: "Ritrovo e partenza",
      entry_type: "timeline",
      phase: "partenza",
      sort_order: 10,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(start),
      event_date: start,
      time_note: "19:00",
      description: "Arrivo in campeggio",
      entry_type: "timeline",
      phase: "soggiorno",
      sort_order: 11,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(start),
      event_date: start,
      time_note: "19:30",
      description: "Montaggio tende",
      entry_type: "timeline",
      phase: "soggiorno",
      sort_order: 12,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(start),
      event_date: start,
      time_note: "20:30",
      description: "Grigliata",
      entry_type: "timeline",
      phase: "soggiorno",
      sort_order: 13,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(start),
      event_date: start,
      time_note: "23:00",
      description: "Chill al fuoco",
      entry_type: "timeline",
      phase: "soggiorno",
      sort_order: 14,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(end),
      event_date: end,
      time_note: "Mattina",
      description: "Attività ed escursione",
      entry_type: "timeline",
      phase: "soggiorno",
      sort_order: 20,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(end),
      event_date: end,
      time_note: "13:00",
      description: "Pranzo e pulizia",
      entry_type: "timeline",
      phase: "soggiorno",
      sort_order: 21,
    },
    {
      trip_id: tripId,
      day_label: dayLabelFromDate(end),
      event_date: end,
      time_note: "14:30",
      description: "Rientro a casa",
      entry_type: "timeline",
      phase: "ritorno",
      sort_order: 30,
    },
  ];

  await supabase.from("schedule_entries").insert(schedule);

  const meals = [
    {
      trip_id: tripId,
      day_label: "Domenica",
      meal_type: "aperitivo",
      title: "Aperitivo arrivo",
      menu: "Snack, bibite, patatine",
      ingredients: "Patatine, noccioline, birre, soft drink",
      equipment_needed: "Taglieri, bicchieri",
    },
    {
      trip_id: tripId,
      day_label: "Domenica",
      meal_type: "cena",
      title: "Cena grigliata",
      menu: "Grigliata, pane, salse, verdure",
      ingredients: "Carne, salsicce, pane, salse, peperoni, zucchine",
      equipment_needed: "Griglia, carbonella, pinze",
    },
    {
      trip_id: tripId,
      day_label: "Domenica",
      meal_type: "notte",
      title: "Notte",
      menu: "Biscotti, cioccolata, bevande calde",
      ingredients: "Biscotti, cioccolata in tazza, tè",
      equipment_needed: "Bollitore, tazze",
    },
    {
      trip_id: tripId,
      day_label: "Lunedì",
      meal_type: "pranzo",
      title: "Pranzo giorno dopo",
      menu: "Pasta fredda, panini, frutta",
      ingredients: "Pasta, pomodorini, panini, mela, banana",
      equipment_needed: "Pentola, coltello",
    },
  ];

  await supabase.from("meals").insert(meals);

  const equipment = [
    { trip_id: tripId, item_name: "Griglia", critical: true },
    { trip_id: tripId, item_name: "Carbonella", critical: true },
    { trip_id: tripId, item_name: "Accendino", critical: true },
    { trip_id: tripId, item_name: "Pinze", critical: false },
    { trip_id: tripId, item_name: "Tenda", critical: true },
    { trip_id: tripId, item_name: "Sacchi a pelo", critical: false },
    { trip_id: tripId, item_name: "Torce", critical: false },
    { trip_id: tripId, item_name: "Powerbank", critical: false },
    { trip_id: tripId, item_name: "Kit primo soccorso", critical: true },
    { trip_id: tripId, item_name: "Sacchi immondizia", critical: false },
    { trip_id: tripId, item_name: "Spray zanzare", critical: false },
    { trip_id: tripId, item_name: "Felpe", critical: false },
    { trip_id: tripId, item_name: "Asciugamani", critical: false },
    { trip_id: tripId, item_name: "Coperte", critical: false },
  ];

  await supabase.from("equipment").insert(equipment);

  await supabase.from("activities").insert([
    {
      trip_id: tripId,
      name: "Beach volley",
      description: "Partita sulla sabbia",
      estimated_cost: 0,
      event_date: end,
      scheduled_time: "Mattina",
      phase: "soggiorno",
      difficulty: "facile",
    },
    {
      trip_id: tripId,
      name: "Passeggiata al tramonto",
      description: "Foto e relax",
      estimated_cost: 0,
      event_date: start,
      scheduled_time: "19:45",
      phase: "soggiorno",
      difficulty: "facile",
    },
    {
      trip_id: tripId,
      name: "Giochi di carte",
      description: "Serata chill",
      estimated_cost: 0,
      event_date: start,
      scheduled_time: "23:00",
      phase: "soggiorno",
      difficulty: "facile",
    },
    {
      trip_id: tripId,
      name: "Mini challenge fotografica",
      description: "Chi fa la foto più bella vince!",
      estimated_cost: 0,
      event_date: start,
      scheduled_time: "Tutto il weekend",
      phase: "soggiorno",
      difficulty: "facile",
    },
    {
      trip_id: tripId,
      name: "Car pooling",
      description: "Organizzare le auto per la partenza",
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
      departure_date: formatItalianDateShort(start),
      return_note: formatItalianDateShort(end),
      address: "Parco del Gravio, Lombardia",
      parking_notes: "Parcheggio gratuito vicino all'ingresso",
      services: "Docce, acqua, area barbecue",
      table_cost: 0,
      grill_rental_cost: 15,
      parking_cost: 5,
      pitch_cost_per_night: 18,
      other_location_cost: 0,
      other_location_cost_label: "",
      contact_info: "Chiamare il giorno prima per confermare posto",
    })
    .eq("id", tripId);
}
