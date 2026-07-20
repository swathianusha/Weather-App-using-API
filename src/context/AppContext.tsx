/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, UserSettings, FavoriteCity, SearchHistoryItem, WeatherPayload, WeatherAlert } from "../types";
import { WeatherInsights } from "../services/geminiService";

export type TabName = "dashboard" | "forecast" | "hourly" | "favorites" | "history" | "settings" | "about";

interface AppContextType {
  // Auth state
  token: string | null;
  user: { id: string; email: string; name: string } | null;
  settings: UserSettings;
  isLoadingUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateSettings: (updates: Partial<Omit<UserSettings, "userId">>) => Promise<void>;

  // Weather state
  weatherData: WeatherPayload | null;
  weatherInsights: WeatherInsights | null;
  isLoadingWeather: boolean;
  isRefreshingWeather: boolean;
  weatherError: string | null;
  silentRefreshError: string | null;
  lastSuccessFetch: number | null;
  fetchWeather: (lat: number, lon: number, cityName?: string, silent?: boolean) => Promise<void>;
  searchCities: (query: string) => Promise<Array<{ name: string; lat: number; lon: number; country: string; state?: string }>>;
  fetchGPSLocation: () => Promise<void>;

  // Favorites & History state
  favorites: FavoriteCity[];
  favoritesAlerts: Array<{ cityName: string; favoriteId: string; alert: WeatherAlert }>;
  history: SearchHistoryItem[];
  addFavorite: (cityName: string, lat: number, lon: number, country?: string, state?: string) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  fetchFavoritesAlerts: () => Promise<void>;

  // View state
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;

  // Formatting helpers
  formatTemp: (celsius: number) => string;
  formatWind: (ms: number) => string;
}

const DEFAULT_SETTINGS: UserSettings = {
  userId: "",
  unit: "metric",
  windUnit: "kmh",
  theme: "dark",
  notifications: true,
  backgroundStyle: "adaptive",
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth
  const [token, setToken] = useState<string | null>(localStorage.getItem("weather_token"));
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Weather
  const [weatherData, setWeatherData] = useState<WeatherPayload | null>(null);
  const [weatherInsights, setWeatherInsights] = useState<WeatherInsights | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [silentRefreshError, setSilentRefreshError] = useState<string | null>(null);
  const [lastSuccessFetch, setLastSuccessFetch] = useState<number | null>(null);

  // Lists
  const [favorites, setFavorites] = useState<FavoriteCity[]>([]);
  const [favoritesAlerts, setFavoritesAlerts] = useState<Array<{ cityName: string; favoriteId: string; alert: WeatherAlert }>>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Navigation
  const [activeTab, setActiveTab] = useState<TabName>("dashboard");

  // Load User details if token exists on startup
  const fetchUserData = useCallback(async (jwtToken: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSettings(data.settings);
        
        // Fetch favorites and history
        await Promise.all([
          fetchFavorites(jwtToken),
          fetchHistory(jwtToken)
        ]);
      } else {
        // Token invalid, clear it
        logout();
      }
    } catch (e) {
      console.error("Failed to fetch user profiles:", e);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserData(token);
    } else {
      setIsLoadingUser(false);
    }
  }, [token, fetchUserData]);

  // Sync theme setting to body tag
  useEffect(() => {
    const currentTheme = settings.theme;
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    
    if (currentTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(currentTheme);
    }
  }, [settings.theme]);

  // Fetch Favorites from API
  const fetchFavorites = async (jwt: string) => {
    try {
      const res = await fetch("/api/favorites", {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch History from API
  const fetchHistory = async (jwt: string) => {
    try {
      const res = await fetch("/api/history", {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Login handler
  const login = async (email: string, passwordPlain: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: passwordPlain }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }

    const data = await res.json();
    localStorage.setItem("weather_token", data.token);
    setToken(data.token);
    setUser(data.user);
    setSettings(data.settings);
    await Promise.all([
      fetchFavorites(data.token),
      fetchHistory(data.token)
    ]);
  };

  // Register handler
  const register = async (name: string, email: string, passwordPlain: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: passwordPlain }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Registration failed");
    }

    const data = await res.json();
    localStorage.setItem("weather_token", data.token);
    setToken(data.token);
    setUser(data.user);
    setSettings(data.settings);
    setFavorites([]);
    setHistory([]);
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem("weather_token");
    setToken(null);
    setUser(null);
    setSettings(DEFAULT_SETTINGS);
    setFavorites([]);
    setHistory([]);
    setActiveTab("dashboard");
  };

  // Update Settings handler
  const updateSettings = async (updates: Partial<Omit<UserSettings, "userId">>) => {
    if (!token) {
      // Local-only state update if offline / not logged in
      setSettings((prev) => ({ ...prev, ...updates }));
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error("Failed to update settings:", e);
    }
  };

  // Helper to trigger browser notifications for critical alerts
  const triggerBrowserNotifications = (alerts: WeatherAlert[], cityName: string) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      alerts.forEach((alert) => {
        new Notification(`⚠️ Weather Alert: ${alert.event} in ${cityName}`, {
          body: `${alert.description} (Issued by ${alert.senderName})`,
          icon: "/favicon.ico",
        });
      });
    }
  };

  // Request browser notification permissions if enabled in settings
  useEffect(() => {
    if (settings.notifications && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [settings.notifications]);

  // Fetch Weather main engine
  const fetchWeather = async (lat: number, lon: number, cityName?: string, silent = false) => {
    if (silent) {
      setIsRefreshingWeather(true);
      setSilentRefreshError(null);
    } else {
      setIsLoadingWeather(true);
      setWeatherError(null);
    }

    try {
      const nameParam = cityName ? `&cityName=${encodeURIComponent(cityName)}` : "";
      
      // Fetch both weather telemetry and AI insights in parallel
      const [weatherRes, insightsRes] = await Promise.all([
        fetch(`/api/weather/data?lat=${lat}&lon=${lon}${nameParam}`),
        fetch(`/api/weather/insights?lat=${lat}&lon=${lon}${nameParam}`)
      ]);

      if (!weatherRes.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const weather = await weatherRes.json();

      // Trigger browser notifications for critical alerts in current city (with deduplication)
      if (settings.notifications && weather.alerts && weather.alerts.length > 0) {
        weather.alerts.forEach((alert: WeatherAlert) => {
          const notifiedKey = `notified_alert_current_${weather.current.cityName}_${alert.event}_${alert.start}`;
          if (!sessionStorage.getItem(notifiedKey)) {
            triggerBrowserNotifications([alert], weather.current.cityName);
            sessionStorage.setItem(notifiedKey, "true");
          }
        });
      }

      setWeatherData(weather);
      setLastSuccessFetch(Date.now());
      if (silent) {
        setSilentRefreshError(null);
      }

      if (insightsRes.ok) {
        const insights = await insightsRes.json();
        setWeatherInsights(insights);
      } else {
        setWeatherInsights(null);
      }

      // Add to search history if logged in and not a silent background update
      if (token && !silent) {
        await fetch("/api/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: cityName || weather.current.cityName,
            cityName: weather.current.cityName,
            lat,
            lon,
            country: weather.current.country,
          }),
        });
        await fetchHistory(token);
      }
    } catch (error: any) {
      const msg = error.message || "An error occurred fetching weather data.";
      if (silent) {
        setSilentRefreshError(msg);
      } else {
        setWeatherError(msg);
      }
    } finally {
      if (silent) {
        setIsRefreshingWeather(false);
      } else {
        setIsLoadingWeather(false);
      }
    }
  };

  // Fetch weather alerts for favorite cities
  const fetchFavoritesAlerts = useCallback(async () => {
    if (favorites.length === 0) {
      setFavoritesAlerts([]);
      return;
    }

    try {
      const results = await Promise.all(
        favorites.map(async (fav) => {
          try {
            const res = await fetch(`/api/weather/data?lat=${fav.lat}&lon=${fav.lon}`);
            if (res.ok) {
              const data = await res.json();
              if (data.alerts && data.alerts.length > 0) {
                return data.alerts.map((alert: WeatherAlert) => ({
                  cityName: fav.cityName,
                  favoriteId: fav.id,
                  alert,
                }));
              }
            }
          } catch (e) {
            console.error(`Failed to fetch alerts for favorite ${fav.cityName}:`, e);
          }
          return [];
        })
      );

      const flatAlerts = results.flat();
      setFavoritesAlerts(flatAlerts);

      // Trigger browser notifications for favorite city alerts (with deduplication)
      if (settings.notifications && flatAlerts.length > 0) {
        flatAlerts.forEach((item) => {
          if (!("Notification" in window)) return;
          if (Notification.permission === "granted") {
            const notifiedKey = `notified_alert_${item.favoriteId}_${item.alert.event}_${item.alert.start}`;
            if (!sessionStorage.getItem(notifiedKey)) {
              new Notification(`⚠️ Weather Alert: ${item.alert.event} in ${item.cityName}`, {
                body: `${item.alert.description} (Issued by ${item.alert.senderName})`,
              });
              sessionStorage.setItem(notifiedKey, "true");
            }
          }
        });
      }
    } catch (e) {
      console.error("Failed to fetch favorite alerts:", e);
    }
  }, [favorites, settings.notifications]);

  // Load favorite alerts when favorites array is loaded or changes
  useEffect(() => {
    fetchFavoritesAlerts();
  }, [favorites, fetchFavoritesAlerts]);

  // City geocoding search dispatcher
  const searchCities = async (query: string) => {
    const res = await fetch(`/api/weather/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error("Search failed");
    }
    return await res.json();
  };

  // Fetch weather using Geolocation (GPS)
  const fetchGPSLocation = async () => {
    if (!navigator.geolocation) {
      setWeatherError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoadingWeather(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Attempt reverse geocoding to get human city name first
          const revRes = await fetch(`/api/weather/reverse?lat=${latitude}&lon=${longitude}`);
          let name;
          if (revRes.ok) {
            const data = await revRes.json();
            name = data.name;
          }
          await fetchWeather(latitude, longitude, name);
        } catch (error) {
          await fetchWeather(latitude, longitude);
        }
      },
      (error) => {
        setIsLoadingWeather(false);
        setWeatherError("Permission to access GPS location denied. Please search for a city instead.");
      },
      { timeout: 10000 }
    );
  };

  // Add Favorite City handler
  const addFavorite = async (cityName: string, lat: number, lon: number, country?: string, state?: string) => {
    if (!token) {
      throw new Error("Authentication required to save favorites");
    }

    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cityName, lat, lon, country, state }),
    });

    if (!res.ok) {
      throw new Error("Failed to save favorite city");
    }

    await fetchFavorites(token);
  };

  // Remove Favorite City handler
  const removeFavorite = async (id: string) => {
    if (!token) return;

    const res = await fetch(`/api/favorites/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      await fetchFavorites(token);
    }
  };

  // Clear Search History handler
  const clearHistory = async () => {
    if (!token) return;

    const res = await fetch("/api/history", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setHistory([]);
    }
  };

  // Auto-refresh mechanism (refreshes current weather coordinates every 5 minutes if tab is active)
  useEffect(() => {
    const interval = setInterval(() => {
      if (weatherData && !isLoadingWeather && !isRefreshingWeather && document.visibilityState === "visible") {
        fetchWeather(weatherData.current.lat, weatherData.current.lon, weatherData.current.cityName, true);
        fetchFavoritesAlerts();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [weatherData, isLoadingWeather, isRefreshingWeather, fetchFavoritesAlerts]);

  // Load standard initial city (New York) if weatherData is empty on startup
  useEffect(() => {
    if (!weatherData && !isLoadingWeather) {
      fetchWeather(40.7128, -74.0060, "New York");
    }
  }, []);

  // Formatting helpers based on units selection
  const formatTemp = (celsius: number): string => {
    if (settings.unit === "imperial") {
      const fahr = (celsius * 9) / 5 + 32;
      return `${Math.round(fahr)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  const formatWind = (ms: number): string => {
    if (settings.windUnit === "kmh") {
      const kmh = ms * 3.6;
      return `${kmh.toFixed(1)} km/h`;
    } else if (settings.windUnit === "mph") {
      const mph = ms * 2.237;
      return `${mph.toFixed(1)} mph`;
    }
    return `${ms.toFixed(1)} m/s`;
  };

  return (
    <AppContext.Provider
      value={{
        token,
        user,
        settings,
        isLoadingUser,
        login,
        register,
        logout,
        updateSettings,
        weatherData,
        weatherInsights,
        isLoadingWeather,
        isRefreshingWeather,
        weatherError,
        silentRefreshError,
        lastSuccessFetch,
        fetchWeather,
        searchCities,
        fetchGPSLocation,
        favorites,
        favoritesAlerts,
        history,
        addFavorite,
        removeFavorite,
        clearHistory,
        fetchFavoritesAlerts,
        activeTab,
        setActiveTab,
        formatTemp,
        formatWind,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
