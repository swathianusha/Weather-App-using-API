/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Database & User Types ---

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  unit: "metric" | "imperial"; // Celsius vs Fahrenheit
  windUnit: "kmh" | "mph" | "ms";
  theme: "light" | "dark" | "system";
  notifications: boolean;
  backgroundStyle?: "adaptive" | "midnight" | "nordic" | "forest" | "sunset" | "neon";
}

export interface FavoriteCity {
  id: string;
  userId: string;
  cityName: string;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
  createdAt: string;
}

export interface SearchHistoryItem {
  id: string;
  userId: string;
  query: string;
  cityName: string;
  country?: string;
  state?: string;
  lat: number;
  lon: number;
  createdAt: string;
}

// --- Weather Data Types ---

export interface CurrentWeatherData {
  cityName: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  visibility: number;
  windSpeed: number;
  windDeg: number;
  uvIndex: number;
  sunrise: number; // Unix timestamp
  sunset: number;  // Unix timestamp
  description: string;
  mainCondition: string; // e.g. "Rain", "Clouds", "Clear"
  icon: string;
  fetchedAt: number;     // Timestamp when fetched
}

export interface HourlyForecastItem {
  time: string;          // e.g., "14:00" or "2 PM"
  temp: number;
  icon: string;
  description: string;
  pop: number;           // Probability of precipitation (0 to 1)
  timestamp: number;     // Unix timestamp
}

export interface DailyForecastItem {
  date: string;          // e.g., "Monday" or "Jul 21"
  tempMin: number;
  tempMax: number;
  icon: string;
  description: string;
  mainCondition: string;
  pop: number;           // Probability of precipitation (0 to 1)
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  timestamp: number;     // Unix timestamp
}

export interface AirQualityData {
  aqi: number;           // 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = Very Poor
  pm2_5: number;         // Particulate matter 2.5
  pm10: number;          // Particulate matter 10
  no2: number;           // Nitrogen dioxide
  o3: number;            // Ozone
  so2: number;           // Sulfur dioxide
  co: number;            // Carbon monoxide
}

export interface WeatherAlert {
  senderName: string;
  event: string;
  start: number;         // Unix timestamp
  end: number;           // Unix timestamp
  description: string;
}

// Unified Weather Payload returned by our server API
export interface WeatherPayload {
  current: CurrentWeatherData;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  airQuality: AirQualityData;
  alerts: WeatherAlert[];
  isMock?: boolean;       // Flag if mock data is used
}

// --- API Request/Response Types ---

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  settings: UserSettings;
}
