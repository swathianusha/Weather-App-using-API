/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, HeartOff, Sparkles, AlertTriangle, ChevronDown, ChevronUp, Trash2, 
  MapPin, Settings2, Info, BookOpen, Layers, CheckCircle2, UserCheck, CloudRain,
  RefreshCw, AlertCircle
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { WeatherIcon } from "./WeatherIcons";
import { TemperatureGraph } from "./WeatherCharts";
import { WindCard, HumidityCard, AirQualityCard, UVIndexCard, SunriseSunsetCard } from "./WeatherMetrics";

// --- DASHBOARD VIEW ---
export const DashboardPage: React.FC = () => {
  const { 
    weatherData, 
    weatherInsights, 
    token, 
    favorites, 
    favoritesAlerts, 
    addFavorite, 
    removeFavorite, 
    formatTemp,
    isRefreshingWeather,
    isLoadingWeather,
    silentRefreshError,
    lastSuccessFetch,
    fetchWeather
  } = useApp();

  const [timeText, setTimeText] = useState("Just now");

  useEffect(() => {
    if (!lastSuccessFetch) return;
    const updateText = () => {
      const diffMs = Date.now() - lastSuccessFetch;
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 10) {
        setTimeText("Just now");
      } else if (diffSecs < 60) {
        setTimeText(`${diffSecs}s ago`);
      } else {
        const mins = Math.floor(diffSecs / 60);
        setTimeText(`${mins}m ago`);
      }
    };
    updateText();
    const interval = setInterval(updateText, 5000);
    return () => clearInterval(interval);
  }, [lastSuccessFetch]);

  if (!weatherData) return null;

  const { cityName, country, state, lat, lon, temp, description, mainCondition, icon } = weatherData.current;
  
  // Check if current city is in favorites
  const favoriteItem = favorites.find((f) => f.lat === lat && f.lon === lon);
  const isFavorite = !!favoriteItem;

  const handleFavoriteToggle = async () => {
    if (!token) {
      alert("Please Connect an Account first using the button in the sidebar to save favorite cities!");
      return;
    }
    try {
      if (isFavorite) {
        await removeFavorite(favoriteItem.id);
      } else {
        await addFavorite(cityName, lat, lon, country, state);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Combine current city alerts and favorite city alerts
  const currentAlerts = weatherData.alerts || [];
  
  // Filter out favorites alerts that are already in currentAlerts (by checking cityName)
  const filteredFavAlerts = favoritesAlerts.filter(fa => {
    if (fa.cityName.toLowerCase() === cityName.toLowerCase()) return false;
    return true;
  });

  const totalAlertsCount = currentAlerts.length + filteredFavAlerts.length;

  return (
    <div id="dashboard-page" className="space-y-6">
      {/* Background/Silent Refresh Error Banner */}
      {silentRefreshError && (
        <div 
          id="silent-refresh-error-banner" 
          className="p-4 rounded-3xl bg-red-500/20 border border-red-500/30 backdrop-blur-md flex items-center justify-between gap-3 text-red-200 text-xs font-mono shadow-lg animate-fade-in"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>Could not refresh weather automatically: {silentRefreshError}. Showing previous weather telemetry.</span>
          </div>
          <button 
            onClick={() => fetchWeather(lat, lon, cityName, true)}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all text-[11px] font-extrabold uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      )}

      {/* Dynamic Weather Header Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Weather Summary Card */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          {/* Weather Ambient Background light glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>
          
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-2 text-white/60 text-xs font-mono uppercase tracking-[0.15em]">
                <MapPin size={12} className="text-[#fdbb2d]" />
                {state ? `${state}, ` : ""}{country || "Global"}
                <span className="text-white/30 font-sans">&bull;</span>
                <span className="flex items-center gap-1 font-mono text-white/50 text-[10px]">
                  {isRefreshingWeather ? (
                    <>
                      <RefreshCw size={10} className="animate-spin text-[#fdbb2d]" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <span>Updated {timeText}</span>
                    </>
                  )}
                </span>
              </div>
              <h1 className="text-3xl font-display font-black text-white mt-1.5 tracking-tight">
                {cityName}
              </h1>
              <p className="text-sm text-white/80 capitalize mt-1 font-sans">
                {description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Manual refresh button */}
              <button
                onClick={() => fetchWeather(lat, lon, cityName, true)}
                disabled={isRefreshingWeather || isLoadingWeather}
                className="p-2.5 rounded-full border border-white/20 bg-white/10 text-white/60 hover:text-white hover:bg-white/15 hover:border-white/30 transition-all duration-300"
                title="Refresh Weather Now"
                id="manual-refresh-btn"
              >
                <RefreshCw size={18} className={isRefreshingWeather ? "animate-spin text-[#fdbb2d]" : ""} />
              </button>

              {/* Favorite toggle button */}
              <button
                onClick={handleFavoriteToggle}
                className={`p-2.5 rounded-full border transition-all duration-300 ${
                  isFavorite
                    ? "bg-red-500/20 border-red-500/30 text-red-400"
                    : "bg-white/10 border-white/20 text-white/60 hover:text-red-400 hover:border-red-500/30 hover:bg-white/15"
                }`}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                id="favorite-toggle-btn"
              >
                {isFavorite ? <Heart size={18} fill="currentColor" /> : <Heart size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-end justify-between mt-6 z-10">
            <div>
              <span className="text-6xl sm:text-7xl font-display font-black text-white leading-none tracking-tighter">
                {formatTemp(temp)}
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <WeatherIcon iconCode={icon} size={64} className="drop-shadow-lg" />
              <span className="text-xs font-bold text-white/60 uppercase tracking-[0.15em] mt-1.5">
                {mainCondition}
              </span>
            </div>
          </div>
        </div>

        {/* --- GEMINI AI WEATHER INSIGHTS PANEL --- */}
        <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-purple-300 animate-pulse" size={18} />
            <span className="text-xs font-bold text-purple-200 uppercase tracking-[0.15em]">
              Gemini AI Weather Insights
            </span>
            {weatherInsights?.summary && (
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-sm bg-purple-500/20 text-purple-200 ml-auto border border-purple-500/30">
                Live AI
              </span>
            )}
          </div>

          <div className="space-y-3.5 flex-1">
            {weatherInsights ? (
              <>
                <p className="text-xs font-medium italic text-white/95 leading-relaxed border-l-2 border-purple-400 pl-2.5">
                  &ldquo;{weatherInsights.summary}&rdquo;
                </p>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="font-bold text-[10px] text-purple-200 uppercase tracking-[0.15em] block">Clothing Suggestion</span>
                    <p className="text-white/70 leading-normal mt-0.5">{weatherInsights.clothing}</p>
                  </div>
                  <div>
                    <span className="font-bold text-[10px] text-purple-200 uppercase tracking-[0.15em] block">Activities &amp; Plan</span>
                    <p className="text-white/70 leading-normal mt-0.5">{weatherInsights.activities}</p>
                  </div>
                  <div>
                    <span className="font-bold text-[10px] text-purple-200 uppercase tracking-[0.15em] block">Health Precautions</span>
                    <p className="text-white/70 leading-normal mt-0.5">{weatherInsights.precautions}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="h-3 bg-white/10 rounded-full w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-2.5 bg-white/10 rounded-full w-full"></div>
                  <div className="h-2.5 bg-white/10 rounded-full w-5/6"></div>
                  <div className="h-2.5 bg-white/10 rounded-full w-4/5"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prominent Active Weather Alerts Hub */}
      {totalAlertsCount > 0 && (
        <div id="weather-alerts-hub" className="space-y-3 animate-fade-in p-5 rounded-3xl bg-red-950/20 border border-red-500/20 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-400 animate-pulse" size={18} />
            <h3 className="text-xs font-bold text-red-200 uppercase tracking-[0.15em] font-mono">
              Weather Warnings &amp; Advisories Hub ({totalAlertsCount})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Active Location Alerts */}
            {currentAlerts.map((alert, idx) => (
              <div 
                key={`current-alert-${idx}`}
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[8px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 uppercase tracking-wider font-mono">
                      Current City
                    </span>
                    <span className="text-[9px] text-white/40 font-mono">
                      Issued by {alert.senderName}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-red-200 mt-2 tracking-tight">
                    {alert.event} in {cityName}
                  </h4>
                  <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
                    {alert.description}
                  </p>
                </div>
                <div className="border-t border-white/5 mt-3 pt-2 flex items-center justify-between text-[9px] font-mono text-white/40">
                  <span>Starts: {new Date(alert.start * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>Ends: {new Date(alert.end * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(alert.end * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}

            {/* Favorite Cities Active Alerts */}
            {filteredFavAlerts.map((favAlert, idx) => (
              <div 
                key={`fav-alert-${idx}`}
                className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider font-mono">
                      Favorite City Alert
                    </span>
                    <span className="text-[9px] text-white/40 font-mono">
                      {favAlert.cityName}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-amber-200 mt-2 tracking-tight">
                    {favAlert.alert.event}
                  </h4>
                  <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
                    {favAlert.alert.description} <span className="text-[9px] text-white/40 font-mono">(Issued by {favAlert.alert.senderName})</span>
                  </p>
                </div>
                <div className="border-t border-white/5 mt-3 pt-2 flex items-center justify-between text-[9px] font-mono text-white/40">
                  <span>Starts: {new Date(favAlert.alert.start * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>Ends: {new Date(favAlert.alert.end * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(favAlert.alert.end * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bento-Style Weather Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="bento-grid">
        <WindCard />
        <HumidityCard />
        <AirQualityCard />
        <UVIndexCard />
        <SunriseSunsetCard />
      </div>
    </div>
  );
};

// --- 7-DAY FORECAST VIEW ---
export const ForecastPage: React.FC = () => {
  const { weatherData, formatTemp, formatWind } = useApp();
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  if (!weatherData) return null;

  return (
    <div id="forecast-page" className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-black text-white tracking-tight">
          7-Day Meteorological Outlook
        </h2>
        <p className="text-xs text-white/60 mt-1 font-mono">
          Detailed long-range weather projections aggregated from localized measurements
        </p>
      </div>

      <div className="space-y-3" id="forecast-day-list">
        {weatherData.daily.map((day, idx) => {
          const isExpanded = expandedDay === idx;

          return (
            <div 
              key={day.date + idx}
              className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl overflow-hidden transition-all duration-300 shadow-md"
            >
              {/* Day Header Row */}
              <button
                onClick={() => setExpandedDay(isExpanded ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none hover:bg-white/10 transition-colors"
                id={`forecast-row-${idx}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm font-bold text-white font-mono">
                    {day.date}
                  </div>
                  <WeatherIcon iconCode={day.icon} size={32} />
                  <div className="hidden sm:block text-xs text-white/75 capitalize font-medium">
                    {day.description}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {day.pop > 0.1 && (
                    <div className="flex items-center gap-1 text-xs text-cyan-200 font-bold font-mono">
                      <CloudRain size={12} />
                      {Math.round(day.pop * 100)}%
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 text-sm font-mono font-semibold">
                    <span className="text-white/50">{formatTemp(day.tempMin)}</span>
                    <span className="text-white/30">/</span>
                    <span className="text-white font-black">{formatTemp(day.tempMax)}</span>
                  </div>

                  <div>
                    {isExpanded ? <ChevronUp size={16} className="text-white/60" /> : <ChevronDown size={16} className="text-white/60" />}
                  </div>
                </div>
              </button>

              {/* Expanded Astro details panel */}
              {isExpanded && (
                <div className="p-4 bg-white/5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-white/40 uppercase tracking-[0.15em] text-[9px] font-bold">Atmosphere</span>
                    <p className="font-bold text-white mt-1 capitalize">{day.description}</p>
                  </div>
                  <div>
                    <span className="text-white/40 uppercase tracking-[0.15em] text-[9px] font-bold">Humidity</span>
                    <p className="font-bold text-white mt-1">{day.humidity}%</p>
                  </div>
                  <div>
                    <span className="text-white/40 uppercase tracking-[0.15em] text-[9px] font-bold">Est. Wind</span>
                    <p className="font-bold text-white mt-1">{formatWind(day.windSpeed)}</p>
                  </div>
                  <div>
                    <span className="text-white/40 uppercase tracking-[0.15em] text-[9px] font-bold">UV Max</span>
                    <p className="font-bold text-white mt-1">UV {day.uvIndex.toFixed(1)}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- HOURLY FORECAST VIEW ---
export const HourlyPage: React.FC = () => {
  const { weatherData, formatTemp } = useApp();

  if (!weatherData) return null;

  return (
    <div id="hourly-page" className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-black text-white tracking-tight">
          Hourly Trends &amp; Telemetry
        </h2>
        <p className="text-xs text-white/60 mt-1 font-mono">
          Real-time trend analysis plotting high-frequency temperature variations and cloud density
        </p>
      </div>

      {/* Temperature Trend Line area graph */}
      <TemperatureGraph />

      {/* Scrollable hourly cards */}
      <div>
        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em] mb-3">
          Timeline Scroller
        </h3>
        <div 
          className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
          id="hourly-timeline-scroller"
        >
          {weatherData.hourly.map((hour, idx) => (
            <div 
              key={hour.timestamp + idx}
              className="p-4 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl min-w-[105px] flex flex-col items-center justify-between shrink-0 text-center shadow-md hover:bg-white/15 transition-all duration-300"
            >
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-wide font-mono">
                {hour.time}
              </span>
              <WeatherIcon iconCode={hour.icon} size={28} className="my-3 drop-shadow-md" />
              <span className="text-sm font-mono font-extrabold text-white">
                {formatTemp(hour.temp)}
              </span>
              {hour.pop > 0.1 ? (
                <span className="text-[9px] font-bold text-blue-200 mt-1.5 flex items-center gap-0.5 font-mono">
                  <CloudRain size={8} />
                  {Math.round(hour.pop * 100)}%
                </span>
              ) : (
                <span className="text-[9px] font-mono text-white/30 mt-1.5">&mdash;</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- FAVORITE CITIES VIEW ---
export const FavoritesPage: React.FC = () => {
  const { token, favorites, removeFavorite, fetchWeather, setActiveTab } = useApp();
  const [favoriteWeatherList, setFavoriteWeatherList] = useState<Record<string, { temp: number; icon: string; desc: string }>>({});

  // Dynamic fetch temperatures for Favorites on page load
  useEffect(() => {
    let active = true;
    if (!token || favorites.length === 0) return;

    const fetchFavWeather = async () => {
      const dataMap: Record<string, any> = {};
      for (const fav of favorites) {
        try {
          const res = await fetch(`/api/weather/data?lat=${fav.lat}&lon=${fav.lon}`);
          if (res.ok && active) {
            const data = await res.json();
            dataMap[fav.id] = {
              temp: data.current.temp,
              icon: data.current.icon,
              desc: data.current.description,
            };
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (active) setFavoriteWeatherList(dataMap);
    };

    fetchFavWeather();
    return () => { active = false; };
  }, [favorites, token]);

  const handleNavigate = async (fav: any) => {
    const label = fav.state ? `${fav.cityName}, ${fav.state}` : fav.cityName;
    await fetchWeather(fav.lat, fav.lon, label);
    setActiveTab("dashboard");
  };

  if (!token) {
    return (
      <div id="favorites-unauth" className="p-8 text-center max-w-md mx-auto my-12 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-xl shadow-xl">
        <Heart className="mx-auto text-red-300 mb-4 animate-pulse" size={44} />
        <h3 className="font-display font-bold text-lg text-white">Favorite Locations</h3>
        <p className="text-xs text-white/60 leading-relaxed mt-2 mb-6 font-mono">
          Connect your account to lock in favorite locations, enabling quick-clicks and personalized monitoring.
        </p>
      </div>
    );
  }

  return (
    <div id="favorites-page" className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-black text-white tracking-tight">
          Saved Favorite Locations
        </h2>
        <p className="text-xs text-white/60 mt-1 font-mono">
          Quick access panel for saved coordinates and their live climates
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/20 rounded-3xl bg-white/5">
          <Heart className="mx-auto text-white/40 mb-3" size={32} />
          <p className="text-xs text-white/50 font-mono">Your favorite locations list is currently empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="favorites-cards-grid">
          {favorites.map((fav) => {
            const live = favoriteWeatherList[fav.id];

            return (
              <div 
                key={fav.id}
                className="p-5 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl flex flex-col justify-between hover:bg-white/15 hover:scale-[1.02] transition-all duration-300 shadow-md group"
                id={`favorite-card-${fav.id}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/50 block">
                      {fav.country}
                    </span>
                    <button
                      onClick={() => handleNavigate(fav)}
                      className="text-base font-extrabold text-white hover:text-[#fdbb2d] text-left mt-1 block tracking-tight transition-colors"
                    >
                      {fav.cityName}
                    </button>
                    {fav.state && (
                      <span className="text-xs text-white/60 leading-none font-mono mt-0.5 block">{fav.state}</span>
                    )}
                  </div>

                  <button
                    onClick={() => removeFavorite(fav.id)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors opacity-80 group-hover:opacity-100"
                    title="Delete favorite"
                    id={`fav-delete-btn-${fav.id}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="border-t border-white/10 mt-4 pt-3 flex items-center justify-between">
                  {live ? (
                    <>
                      <div className="flex items-center gap-2">
                        <WeatherIcon iconCode={live.icon} size={24} />
                        <span className="text-xs text-white/70 capitalize">{live.desc}</span>
                      </div>
                      <span className="text-lg font-mono font-extrabold text-white">
                        {Math.round(live.temp)}°C
                      </span>
                    </>
                  ) : (
                    <div className="h-4 w-full bg-white/10 animate-pulse rounded-full"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- SEARCH HISTORY VIEW ---
export const HistoryPage: React.FC = () => {
  const { token, history, clearHistory, fetchWeather, setActiveTab } = useApp();

  const handleNavigate = async (item: any) => {
    const label = item.state ? `${item.cityName}, ${item.state}` : item.cityName;
    await fetchWeather(item.lat, item.lon, label);
    setActiveTab("dashboard");
  };

  if (!token) {
    return (
      <div id="history-unauth" className="p-8 text-center max-w-md mx-auto my-12 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-xl shadow-xl">
        <History className="mx-auto text-white/60 mb-4 animate-pulse" size={44} />
        <h3 className="font-display font-bold text-lg text-white">Recent Searches</h3>
        <p className="text-xs text-white/60 leading-relaxed mt-2 mb-6 font-mono">
          Connect your account to review and save recent geolocation searches for instant offline reloading.
        </p>
      </div>
    );
  }

  return (
    <div id="history-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-black text-white tracking-tight">
            Location Search History
          </h2>
          <p className="text-xs text-white/60 mt-1 font-mono">
            Historical overview of queries looked up during active sessions
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs font-bold text-red-300 hover:bg-red-500/20 px-3 py-1.5 rounded-2xl border border-red-500/30 transition-all flex items-center gap-1.5"
            id="clear-history-btn"
          >
            <Trash2 size={13} />
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/20 rounded-3xl bg-white/5">
          <History className="mx-auto text-white/30 mb-3" size={32} />
          <p className="text-xs text-white/50 font-mono">Search history empty. Try looking up a city!</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl overflow-hidden divide-y divide-white/10 shadow-lg" id="history-list">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item)}
              className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-white/10 transition-colors"
            >
              <div>
                <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider block font-mono">
                  Looked up &bull; {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <span className="text-sm font-extrabold text-white mt-0.5 block tracking-tight">
                  {item.cityName}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="text-[10px] font-mono text-white/50">
                  {item.lat.toFixed(2)}N, {item.lon.toFixed(2)}E
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-white/15 text-white/90 border border-white/25">
                  {item.country}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- SETTINGS VIEW ---
export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, token } = useApp();

  return (
    <div id="settings-page" className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-black text-white tracking-tight">
          Application Preferences
        </h2>
        <p className="text-xs text-white/60 mt-1 font-mono">
          Adjust temperature units, wind gauges, and interface telemetry settings
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 max-w-2xl divide-y divide-white/15 shadow-xl" id="settings-container">
        {/* Unit preference celsius vs fahrenheit */}
        <div className="py-4 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-white block">Temperature Scale</span>
            <span className="text-xs text-white/60">Select scale units of measurement</span>
          </div>
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => updateSettings({ unit: "metric" })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                settings.unit === "metric" ? "bg-white text-slate-900 shadow-sm" : "text-white/60 hover:text-white"
              }`}
            >
              Celsius (°C)
            </button>
            <button
              onClick={() => updateSettings({ unit: "imperial" })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                settings.unit === "imperial" ? "bg-white text-slate-900 shadow-sm" : "text-white/60 hover:text-white"
              }`}
            >
              Fahrenheit (°F)
            </button>
          </div>
        </div>

        {/* Wind Speed Units */}
        <div className="py-4 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-white block">Wind Velocity Scales</span>
            <span className="text-xs text-white/60">Select speed indicator scales</span>
          </div>
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
            {["ms", "kmh", "mph"].map((unit) => (
              <button
                key={unit}
                onClick={() => updateSettings({ windUnit: unit as any })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  settings.windUnit === unit ? "bg-white text-slate-900 shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        {/* Theme select */}
        <div className="py-4 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-white block">Visual Interface Theme</span>
            <span className="text-xs text-white/60">Choose your visual backdrop theme</span>
          </div>
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
            {["light", "dark", "system"].map((t) => (
              <button
                key={t}
                onClick={() => updateSettings({ theme: t as any })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  settings.theme === t ? "bg-white text-slate-900 shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Background Color Preset Selector */}
        <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-sm font-bold text-white block">App Background Backdrop</span>
            <span className="text-xs text-white/60">Choose a rich color gradient or let it adapt to weather</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/10">
            {[
              { id: "adaptive", label: "Adaptive", color: "from-[#1a2a6c] via-[#b21f1f] to-[#fdbb2d]" },
              { id: "midnight", label: "Midnight", color: "from-[#020617] via-[#0f172a] to-[#1e293b]" },
              { id: "nordic", label: "Nordic", color: "from-[#1e293b] via-[#334155] to-[#0f172a]" },
              { id: "forest", label: "Forest", color: "from-[#022c22] via-[#064e3b] to-[#022c22]" },
              { id: "sunset", label: "Sunset", color: "from-[#450a0a] via-[#7c2d12] to-[#78350f]" },
              { id: "neon", label: "Neon", color: "from-[#1e1b4b] via-[#311042] to-[#1e1b4b]" },
            ].map((bg) => (
              <button
                key={bg.id}
                onClick={() => updateSettings({ backgroundStyle: bg.id as any })}
                className={`relative px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center gap-1.5 border overflow-hidden ${
                  (settings.backgroundStyle || "adaptive") === bg.id
                    ? "bg-white text-slate-900 border-white shadow-md scale-105"
                    : "text-white hover:bg-white/5 border-transparent"
                }`}
                title={bg.label}
              >
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${bg.color} border border-white/30 shrink-0`} />
                <span className="truncate max-w-[55px] text-[10px] leading-tight">{bg.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notification alerts toggles */}
        <div className="py-4 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-white block">Weather Alerts</span>
            <span className="text-xs text-white/60">Enable local weather hazard notifications</span>
          </div>
          <button
            onClick={() => updateSettings({ notifications: !settings.notifications })}
            className={`w-11 h-6 rounded-full p-1 transition-colors ${
              settings.notifications ? "bg-cyan-400" : "bg-white/10"
            }`}
            id="notif-toggle-btn"
          >
            <div 
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.notifications ? "translate-x-5" : "translate-x-0"
              }`}
            ></div>
          </button>
        </div>
      </div>

      {!token && (
        <div className="p-4 bg-cyan-500/20 border border-cyan-500/30 rounded-2xl max-w-2xl text-xs flex gap-3 text-cyan-200 leading-normal font-mono shadow-md">
          <Info size={16} className="shrink-0 mt-0.5" />
          <span>You are running in Guest Mode. Connect an account to persist these settings onto the server, keeping them synchronized across other devices.</span>
        </div>
      )}
    </div>
  );
};

// --- ABOUT VIEW ---
export const AboutPage: React.FC = () => {
  return (
    <div id="about-page" className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-display font-black text-white tracking-tight">
          Architectural Blueprint &bull; SolCast
        </h2>
        <p className="text-xs text-white/60 mt-1 font-mono">
          Review of structural parameters, backend MVC adapters, and server-side integrations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tech Stack */}
        <div className="p-5 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-lg">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3 tracking-tight">
            <Layers size={16} className="text-[#fdbb2d]" />
            Backend Infrastructure
          </h3>
          <ul className="space-y-2.5 text-xs text-white/70 font-mono">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-300 mt-0.5 shrink-0" />
              <span><strong>Express Server API</strong> handles REST requests for authentication, settings, and geocoding.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-300 mt-0.5 shrink-0" />
              <span><strong>JSON DB Engine</strong> creates a file-based storage fallback (`local_db.json`) for seamless zero-config running in the preview workspace.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-300 mt-0.5 shrink-0" />
              <span><strong>JWT &amp; bcrypt Hashing</strong> handles passwords securely, issuing 7-day cookies and auth tokens.</span>
            </li>
          </ul>
        </div>

        {/* AI Capabilities */}
        <div className="p-5 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-lg">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3 tracking-tight">
            <Sparkles size={16} className="text-purple-300 animate-pulse" />
            Gemini AI Integration
          </h3>
          <ul className="space-y-2.5 text-xs text-white/70 font-mono">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-300 mt-0.5 shrink-0" />
              <span><strong>Server-Side Execution</strong> guarantees all API secrets remain completely hidden from browser inspectors.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-300 mt-0.5 shrink-0" />
              <span><strong>Gemini 1.5 Flash Model</strong> generates real-time contextual clothing, activity guidelines, and safety alerts.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-300 mt-0.5 shrink-0" />
              <span><strong>Static Fallback Cache</strong> intercepts service disruptions to keep weather insights beautifully populated.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Postman Collection description */}
      <div className="p-5 rounded-3xl bg-white/5 border border-white/10 shadow-md">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2 tracking-tight">
          <BookOpen size={16} className="text-[#fdbb2d]" />
          API Integration Guidelines
        </h3>
        <p className="text-xs text-white/70 leading-relaxed font-mono">
          The weather client uses native asynchronous <code>fetch</code> pipelines to retrieve and map complex payloads. Geocoding translates human search queries into coordinates, which are subsequently resolved into a composite payload (Air Pollution indexes, Hourly projections, and Current readings).
        </p>
      </div>
    </div>
  );
};
