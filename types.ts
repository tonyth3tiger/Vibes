export enum WeatherType {
  Sunny = 'Sunny',
  Rainy = 'Rainy',
  Cloudy = 'Cloudy',
  Snowy = 'Snowy'
}

export interface SpendCategory {
  category: string;
  amount: number;
}

export interface ItineraryEvent {
  time?: string;
  description: string;
  location?: string;
}

export interface DayItinerary {
  date: string;
  weather: WeatherType;
  events: ItineraryEvent[];
  highlights: string[]; // Changed from string to string[] for carousel
}

export interface BookletData {
  destination: string;
  totalSpend: number;
  spendBreakdown: SpendCategory[];
  days: DayItinerary[];
}

export interface AppState {
  step: 'input' | 'loading' | 'view';
  data: BookletData | null;
  error: string | null;
}