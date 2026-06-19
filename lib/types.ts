export type TripRole = "owner" | "member";
export type ShoppingCategory = "cibo" | "bevande" | "altro";
export type MealType = "colazione" | "pranzo" | "cena" | "aperitivo" | "cena_speciale" | "notte" | "altro";
export type ScheduleEntryType = "natural" | "timeline";
export type ActivityDifficulty = "facile" | "media" | "difficile";
export type TripPhase = "partenza" | "soggiorno" | "ritorno" | "generale";

export interface Trip {
  id: string;
  name: string;
  location_name: string;
  lat: number;
  lng: number;
  invite_code: string;
  created_by: string;
  created_at: string;
  departure_date: string;
  return_note: string;
  start_date: string | null;
  end_date: string | null;
  address: string;
  parking_notes: string;
  services: string;
  table_cost: number | null;
  grill_rental_cost: number | null;
  parking_cost: number | null;
  pitch_cost_per_night: number | null;
  other_location_cost: number | null;
  other_location_cost_label: string;
  contact_info: string;
}

export interface TripMember {
  trip_id: string;
  user_id: string;
  display_name: string;
  role: TripRole;
  joined_at: string;
}

export interface ScheduleEntry {
  id: string;
  trip_id: string;
  day_label: string;
  event_date: string | null;
  time_note: string;
  description: string;
  entry_type: ScheduleEntryType;
  phase: TripPhase;
  sort_order: number;
  created_by: string | null;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  trip_id: string;
  name: string;
  category: ShoppingCategory;
  quantity: string;
  assigned_to: string | null;
  bought: boolean;
  estimated_price: number | null;
  actual_price: number | null;
  unit_price: number | null;
  pack_size: string | null;
  barcode: string | null;
  brand: string | null;
  image_url: string | null;
  food_type: string | null;
  source: "manual" | "openfoodfacts";
  created_at: string;
}

export interface Meal {
  id: string;
  trip_id: string;
  day_label: string;
  meal_type: MealType;
  title: string;
  menu: string;
  cook: string | null;
  who_brings: string | null;
  equipment_needed: string;
  ingredients: string;
  notes: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  trip_id: string;
  item_name: string;
  assigned_to: string | null;
  confirmed: boolean;
  critical: boolean;
  created_at: string;
}

export interface PersonalPackingItem {
  id: string;
  trip_id: string;
  user_id: string;
  item_key: string;
  custom_label: string | null;
  checked: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  trip_id: string;
  name: string;
  description: string;
  estimated_cost: number | null;
  map_link: string;
  event_date: string | null;
  scheduled_time: string;
  phase: TripPhase;
  difficulty: ActivityDifficulty;
  responsible: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ActivityParticipant {
  activity_id: string;
  user_id: string;
}

export interface ActivityVote {
  activity_id: string;
  user_id: string;
  rating: number;
}

export interface ActivityWithDetails extends Activity {
  activity_participants: { user_id: string }[];
  activity_votes: { user_id: string; rating: number }[];
}

export interface TripPayment {
  id: string;
  trip_id: string;
  user_id: string;
  amount: number;
  label: string;
  created_at: string;
}

export interface WeatherForecastDay {
  date: string;
  label: string;
  tempMax: number;
  tempMin: number;
  icon: string;
  description: string;
}

export interface WeatherInfo {
  temp: number;
  description: string;
  icon: string;
  wind: number;
  forecast: WeatherForecastDay[];
}

export interface FinanceSummary {
  shoppingTotal: number;
  activitiesTotal: number;
  locationTotal: number;
  grandTotal: number;
  perPerson: number;
  memberBalances: {
    userId: string;
    displayName: string;
    paid: number;
    share: number;
    balance: number;
  }[];
}
