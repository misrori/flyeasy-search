export interface Flight {
  varos: string;
  ar: number;
  napok: number;
  orszag: string;
  indulas: string;
  indulas_nap: string;
  indulas_ido: string;
  indulas_napszak: string;
  vissza: string;
  vissza_nap: string;
  vissza_ido: string;
  vissza_napszak: string;
  atszallas_oda: number;
  atszallas_vissza: number;
  repter_id: string;
  link: string;
}

export interface FlightFilters {
  searchQuery: string;
  country: string;
  city: string;
  minPrice: number;
  maxPrice: number;
  departureTimeOfDay: string;
  returnTimeOfDay: string;
  departureDay: string;
  returnDay: string;
  minDays: number;
  maxDays: number;
  directOnly: boolean;
}

export interface GroupedFlights {
  [key: string]: Flight[];
}

export type TimeOfDay = 'reggel' | 'délelőtt' | 'délután' | 'este' | 'éjjel' | '';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | '';
