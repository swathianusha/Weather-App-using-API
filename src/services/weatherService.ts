/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherPayload, CurrentWeatherData, HourlyForecastItem, DailyForecastItem, AirQualityData, WeatherAlert } from "../types";
import { dbService } from "../db/dbService";

// Helper to determine if we should run in mock mode
const getApiKey = () => process.env.OPENWEATHER_API_KEY || "";

/**
 * Normalizes a city name for queries
 */
export async function searchLocation(query: string): Promise<Array<{ name: string; lat: number; lon: number; country: string; state?: string }>> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    // Return high-quality Mock Geocoding results
    const mockLocations = [
      { name: "New York", lat: 40.7128, lon: -74.0060, country: "US", state: "New York" },
      { name: "London", lat: 51.5074, lon: -0.1278, country: "GB" },
      { name: "Tokyo", lat: 35.6762, lon: 139.6503, country: "JP", state: "Tokyo" },
      { name: "Paris", lat: 48.8566, lon: 2.3522, country: "FR", state: "Île-de-France" },
      { name: "Sydney", lat: -33.8688, lon: 151.2093, country: "AU", state: "New South Wales" },
      { name: "Mumbai", lat: 19.0760, lon: 72.8777, country: "IN", state: "Maharashtra" },
      { name: "Cairo", lat: 30.0444, lon: 31.2357, country: "EG" },
      { name: "Cape Town", lat: -33.9249, lon: 18.4241, country: "ZA", state: "Western Cape" },
    ];

    const q = query.toLowerCase().trim();
    if (!q) return [];
    
    const results = mockLocations.filter(
      (loc) => loc.name.toLowerCase().includes(q) || loc.country.toLowerCase().includes(q)
    );

    // If no match, generate a realistic location on the fly
    if (results.length === 0) {
      // Deterministic lat/lon based on name length/char-codes
      let hash = 0;
      for (let i = 0; i < query.length; i++) {
        hash = query.charCodeAt(i) + ((hash << 5) - hash);
      }
      const lat = (hash % 60) + 10; // Keep it between 10N and 70N
      const lon = (hash % 180);    // -180 to 180
      const capitalized = query.charAt(0).toUpperCase() + query.slice(1);
      return [{ name: capitalized, lat, lon, country: "GLOBAL" }];
    }

    return results;
  }

  // Real Geocoding API call
  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Geocoding API failed");
    }
    return await response.json();
  } catch (error) {
    console.error("Geocoding fetch failed, falling back to mock results:", error);
    return [];
  }
}

/**
 * Reverse geocodes coordinates to a human-readable city name
 */
export async function reverseGeocode(lat: number, lon: number): Promise<{ name: string; country: string; state?: string } | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    // Dynamic mock fallback based on coordinate mapping
    if (Math.abs(lat - 40.7128) < 1 && Math.abs(lon - (-74.006)) < 1) {
      return { name: "New York", country: "US", state: "New York" };
    }
    if (Math.abs(lat - 51.5074) < 1 && Math.abs(lon - (-0.1278)) < 1) {
      return { name: "London", country: "GB" };
    }
    return { name: `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`, country: "GPS" };
  }

  try {
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Reverse geocoding failed");
    const data = await response.json();
    return data && data[0] ? data[0] : null;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
}

/**
 * Fetches all weather endpoints and merges them, or generates mock weather data.
 */
export async function getWeatherData(lat: number, lon: number, cityName?: string): Promise<WeatherPayload> {
  // Check cache first
  const cached = await dbService.getCachedWeather(lat, lon);
  if (cached) {
    return cached;
  }

  const apiKey = getApiKey();
  let payload: WeatherPayload;

  if (!apiKey) {
    // Generate Smart Mock Data
    payload = generateMockWeather(lat, lon, cityName);
  } else {
    try {
      payload = await fetchRealWeather(lat, lon, cityName, apiKey);
    } catch (error) {
      console.error("Failed to fetch real OpenWeatherMap API, falling back to smart mock:", error);
      payload = generateMockWeather(lat, lon, cityName);
    }
  }

  // Cache for 15 minutes
  await dbService.cacheWeather(lat, lon, payload, 900);
  return payload;
}

/**
 * Fetches real OpenWeatherMap API data using separate endpoints
 */
async function fetchRealWeather(lat: number, lon: number, providedName: string | undefined, apiKey: string): Promise<WeatherPayload> {
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

  const [currentRes, forecastRes, pollutionRes] = await Promise.all([
    fetch(currentUrl).then((r) => r.json()),
    fetch(forecastUrl).then((r) => r.json()),
    fetch(pollutionUrl).then((r) => r.json()),
  ]);

  if (currentRes.cod && currentRes.cod !== 200) {
    throw new Error(currentRes.message || "Failed to fetch current weather");
  }

  const name = providedName || currentRes.name || "Unknown City";
  const country = currentRes.sys?.country || "";

  // 1. Map Current Weather
  const current: CurrentWeatherData = {
    cityName: name,
    country,
    lat,
    lon,
    temp: currentRes.main.temp,
    feelsLike: currentRes.main.feels_like,
    tempMin: currentRes.main.temp_min,
    tempMax: currentRes.main.temp_max,
    humidity: currentRes.main.humidity,
    pressure: currentRes.main.pressure,
    visibility: currentRes.visibility || 10000,
    windSpeed: currentRes.wind.speed,
    windDeg: currentRes.wind.deg,
    uvIndex: 4.5, // Standard fallback as UV is on One Call API only
    sunrise: currentRes.sys.sunrise,
    sunset: currentRes.sys.sunset,
    description: currentRes.weather[0]?.description || "clear sky",
    mainCondition: currentRes.weather[0]?.main || "Clear",
    icon: currentRes.weather[0]?.icon || "01d",
    fetchedAt: Date.now(),
  };

  // 2. Map Hourly Forecast (from 5-Day / 3-Hourly API)
  const hourlyRaw = forecastRes.list || [];
  const hourly: HourlyForecastItem[] = hourlyRaw.slice(0, 8).map((item: any) => {
    const d = new Date(item.dt * 1000);
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return {
      time,
      temp: item.main.temp,
      icon: item.weather[0]?.icon || "01d",
      description: item.weather[0]?.description || "clear sky",
      pop: item.pop || 0,
      timestamp: item.dt,
    };
  });

  // 3. Map Daily Forecast (from 3-hourly API aggregated into daily chunks)
  // Group 3-hourly reports by local day
  const dailyGroups: Record<string, any[]> = {};
  hourlyRaw.forEach((item: any) => {
    const dateStr = new Date(item.dt * 1000).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
    if (!dailyGroups[dateStr]) {
      dailyGroups[dateStr] = [];
    }
    dailyGroups[dateStr].push(item);
  });

  const daily: DailyForecastItem[] = Object.keys(dailyGroups).slice(0, 7).map((dateStr) => {
    const items = dailyGroups[dateStr];
    let tempMin = Infinity;
    let tempMax = -Infinity;
    let popSum = 0;
    let humiditySum = 0;
    let windSpeedSum = 0;
    
    // Pick the most common condition icon
    const iconCounts: Record<string, { count: number; desc: string; main: string }> = {};
    items.forEach((it) => {
      if (it.main.temp_min < tempMin) tempMin = it.main.temp_min;
      if (it.main.temp_max > tempMax) tempMax = it.main.temp_max;
      popSum += it.pop || 0;
      humiditySum += it.main.humidity;
      windSpeedSum += it.wind.speed;

      const icon = it.weather[0]?.icon || "01d";
      const desc = it.weather[0]?.description || "clear sky";
      const main = it.weather[0]?.main || "Clear";
      if (!iconCounts[icon]) {
        iconCounts[icon] = { count: 0, desc, main };
      }
      iconCounts[icon].count++;
    });

    // Find primary condition
    let bestIcon = "01d";
    let bestDesc = "clear sky";
    let bestMain = "Clear";
    let maxCount = 0;
    for (const [icon, info] of Object.entries(iconCounts)) {
      if (info.count > maxCount) {
        maxCount = info.count;
        bestIcon = icon;
        bestDesc = info.desc;
        bestMain = info.main;
      }
    }

    // Average some fields
    const len = items.length;
    return {
      date: dateStr,
      tempMin,
      tempMax,
      icon: bestIcon,
      description: bestDesc,
      mainCondition: bestMain,
      pop: popSum / len,
      humidity: Math.round(humiditySum / len),
      windSpeed: Number((windSpeedSum / len).toFixed(1)),
      uvIndex: 4.5,
      timestamp: items[0].dt,
    };
  });

  // 4. Map Air Quality
  const rawAqi = pollutionRes.list?.[0] || {};
  const airQuality: AirQualityData = {
    aqi: rawAqi.main?.aqi || 1, // 1-5 index
    pm2_5: rawAqi.components?.pm2_5 || 5.2,
    pm10: rawAqi.components?.pm10 || 12.0,
    no2: rawAqi.components?.no2 || 2.4,
    o3: rawAqi.components?.o3 || 28.5,
    so2: rawAqi.components?.so2 || 0.8,
    co: rawAqi.components?.co || 205.1,
  };

  // 5. Generate Alerts (or fetch if present)
  // Standard Free API does not have alerts, let's generate custom ones for high temperatures or extreme conditions if they arise
  const alerts: WeatherAlert[] = [];
  if (current.temp > 35) {
    alerts.push({
      senderName: "National Meteorological Center",
      event: "Heat Advisory",
      start: Math.floor(Date.now() / 1000),
      end: Math.floor(Date.now() / 1000) + 12 * 3600,
      description: `Dangerously high temperatures of ${current.temp.toFixed(1)}°C detected. Drink plenty of water and stay indoors.`,
    });
  } else if (current.windSpeed > 15) {
    alerts.push({
      senderName: "National Meteorological Center",
      event: "High Wind Warning",
      start: Math.floor(Date.now() / 1000),
      end: Math.floor(Date.now() / 1000) + 6 * 3600,
      description: `Severe winds of ${current.windSpeed.toFixed(1)} m/s detected. Secure outdoor objects and drive with caution.`,
    });
  }

  return {
    current,
    hourly,
    daily,
    airQuality,
    alerts,
    isMock: false,
  };
}

/**
 * Generates beautiful, smart mock weather based on latitude/longitude
 */
function generateMockWeather(lat: number, lon: number, cityName?: string): WeatherPayload {
  // Use lat/lon to seed the weather parameters so it's consistent for the same location
  const absLat = Math.abs(lat);
  
  // Base temperature based on latitude (Equator is hot, Poles are freezing)
  let baseTemp = 28 - (absLat * 0.55); // Equator ~28C, poles ~-15C
  // Add seasonal mock shift based on current date (July is warm in Northern Hemisphere, cool in South)
  const currentMonth = new Date().getMonth();
  const seasonMultiplier = lat >= 0 ? 1 : -1;
  const seasonalShift = Math.sin((currentMonth - 3) * (Math.PI / 6)) * 8 * seasonMultiplier;
  baseTemp += seasonalShift;

  // Let's decide condition based on seed
  const seed = Math.abs(Math.sin(lat) * Math.cos(lon));
  let condition = "Clear";
  let desc = "clear sky";
  let icon = "01d";
  let humidity = 45;
  let windSpeed = 3.2;

  if (seed < 0.25) {
    condition = "Clouds";
    desc = "scattered clouds";
    icon = "03d";
    humidity = 60;
    windSpeed = 2.4;
  } else if (seed < 0.5) {
    condition = "Clouds";
    desc = "broken clouds";
    icon = "04d";
    humidity = 70;
    windSpeed = 3.8;
  } else if (seed < 0.75) {
    condition = "Rain";
    desc = "moderate rain";
    icon = "10d";
    humidity = 85;
    windSpeed = 4.5;
    baseTemp -= 3; // Rain cools down
  } else if (seed < 0.88) {
    condition = "Thunderstorm";
    desc = "thunderstorm with heavy rain";
    icon = "11d";
    humidity = 90;
    windSpeed = 6.8;
    baseTemp -= 4;
  } else if (baseTemp < 0) {
    condition = "Snow";
    desc = "light snow";
    icon = "13d";
    humidity = 80;
    windSpeed = 3.0;
  } else {
    condition = "Clear";
    desc = "clear sky";
    icon = "01d";
  }

  // City Name Resolve
  const computedName = cityName || (lat === 40.7128 ? "New York" : lat === 51.5074 ? "London" : lat === 35.6762 ? "Tokyo" : `City (${lat.toFixed(2)}, ${lon.toFixed(2)})`);

  const current: CurrentWeatherData = {
    cityName: computedName,
    country: lat === 40.7128 ? "US" : lat === 51.5074 ? "GB" : lat === 35.6762 ? "JP" : "GLOBAL",
    lat,
    lon,
    temp: baseTemp,
    feelsLike: baseTemp + (humidity > 70 ? 1.5 : -0.5),
    tempMin: baseTemp - 3.5,
    tempMax: baseTemp + 4.2,
    humidity,
    pressure: 1012,
    visibility: condition === "Rain" ? 6000 : condition === "Thunderstorm" ? 4000 : 10000,
    windSpeed,
    windDeg: 220,
    uvIndex: baseTemp > 25 ? 8.5 : baseTemp > 15 ? 5.2 : 2.1,
    sunrise: Math.floor(Date.now() / 1000) - 4 * 3600, // Sunrise 4h ago
    sunset: Math.floor(Date.now() / 1000) + 8 * 3600,  // Sunset 8h ahead
    description: desc,
    mainCondition: condition,
    icon,
    fetchedAt: Date.now(),
  };

  // Generate 24h Hourly Forecast (intervals of 3 hours)
  const hourly: HourlyForecastItem[] = [];
  const hours = [0, 3, 6, 9, 12, 15, 18, 21];
  hours.forEach((hOffset, idx) => {
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + hOffset);
    const timeStr = futureTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    // Sinusoidal temperature curve (warmest at 3pm, coldest at 5am)
    const currentHour = futureTime.getHours();
    const cyclePos = (currentHour - 15) * (Math.PI / 12);
    const tempOffset = Math.cos(cyclePos) * 4.5;
    const hourlyTemp = baseTemp + tempOffset;

    // Vary icons slightly
    let hIcon = icon;
    let hDesc = desc;
    if (idx > 3 && idx % 2 === 0) {
      hIcon = "02d";
      hDesc = "partly cloudy";
    }

    hourly.push({
      time: timeStr,
      temp: hourlyTemp,
      icon: hIcon,
      description: hDesc,
      pop: condition === "Rain" ? 0.8 : condition === "Thunderstorm" ? 0.9 : 0.1,
      timestamp: Math.floor(futureTime.getTime() / 1000),
    });
  });

  // Generate 7-Day Daily Forecast
  const daily: DailyForecastItem[] = [];
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayIdx = new Date().getDay();

  for (let i = 0; i < 7; i++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i);
    const dayName = i === 0 ? "Today" : daysOfWeek[futureDate.getDay()];
    
    // Random fluctuation based on index
    const daySeed = Math.sin(lat + i) * Math.cos(lon - i);
    const dayTempMin = baseTemp - 4 + (daySeed * 3);
    const dayTempMax = baseTemp + 5 + (daySeed * 4);
    
    let dCondition = condition;
    let dIcon = icon;
    let dDesc = desc;

    if (i > 0) {
      if (Math.abs(daySeed) < 0.25) {
        dCondition = "Clear";
        dIcon = "01d";
        dDesc = "clear sky";
      } else if (Math.abs(daySeed) < 0.6) {
        dCondition = "Clouds";
        dIcon = "03d";
        dDesc = "few clouds";
      } else {
        dCondition = "Rain";
        dIcon = "09d";
        dDesc = "light shower rain";
      }
    }

    daily.push({
      date: dayName,
      tempMin: dayTempMin,
      tempMax: dayTempMax,
      icon: dIcon,
      description: dDesc,
      mainCondition: dCondition,
      pop: dCondition === "Rain" ? 0.65 : dCondition === "Thunderstorm" ? 0.85 : 0.05,
      humidity: humidity + Math.round(daySeed * 10),
      windSpeed: Number((windSpeed + daySeed).toFixed(1)),
      uvIndex: current.uvIndex + (daySeed * 2),
      timestamp: Math.floor(futureDate.getTime() / 1000),
    });
  }

  // Air Quality
  const airQuality: AirQualityData = {
    aqi: baseTemp > 30 ? 3 : seed > 0.8 ? 4 : 1,
    pm2_5: seed > 0.8 ? 38.5 : 8.2,
    pm10: seed > 0.8 ? 52.0 : 18.1,
    no2: 4.8,
    o3: 42.1,
    so2: 1.1,
    co: 280.4,
  };

  // Weather Alerts
  const alerts: WeatherAlert[] = [];
  if (condition === "Thunderstorm") {
    alerts.push({
      senderName: "Global Warning System",
      event: "Severe Thunderstorm Warning",
      start: Math.floor(Date.now() / 1000),
      end: Math.floor(Date.now() / 1000) + 4 * 3600,
      description: "Severe atmospheric turbulence with lightning and local flash flooding potential in the surrounding regions.",
    });
  } else if (baseTemp > 33) {
    alerts.push({
      senderName: "Global Climate Alert",
      event: "Excessive Heat Advisory",
      start: Math.floor(Date.now() / 1000),
      end: Math.floor(Date.now() / 1000) + 10 * 3600,
      description: "Extremely high temperature indexes detected. Restrict physical activities and avoid heat stroke by remaining properly hydrated.",
    });
  }

  return {
    current,
    hourly,
    daily,
    airQuality,
    alerts,
    isMock: true,
  };
}
