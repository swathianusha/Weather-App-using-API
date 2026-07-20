/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Wind, Droplets, Compass, ShieldAlert, Sun, Sunrise, Sunset, Eye } from "lucide-react";
import { useApp } from "../context/AppContext";

// --- Wind Card Component ---
export const WindCard: React.FC = () => {
  const { weatherData, formatWind } = useApp();
  if (!weatherData) return null;

  const { windSpeed, windDeg } = weatherData.current;

  return (
    <div id="metric-wind" className="p-5 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex flex-col justify-between h-full shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em] flex items-center gap-1.5">
          <Wind size={14} className="text-blue-300" />
          Wind Velocity
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30">
          Real-time
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className="text-4xl font-display font-extrabold text-white leading-none">
            {formatWind(windSpeed)}
          </span>
          <p className="text-xs text-white/60 mt-1.5 font-mono">
            Bearing: {windDeg}°
          </p>
        </div>

        <div className="relative w-14 h-14 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
          <Compass size={28} className="text-white/30 animate-spin-slow" />
          <div 
            className="absolute top-1 bottom-1 w-0.5 bg-blue-300 transition-transform duration-500"
            style={{ transform: `rotate(${windDeg}deg)` }}
          >
            <div className="w-1.5 h-1.5 bg-blue-300 rounded-full -mt-0.5 -ml-0.5"></div>
          </div>
          <span className="absolute text-[8px] font-mono top-1 text-white/40">N</span>
        </div>
      </div>
    </div>
  );
};

// --- Humidity Card Component ---
export const HumidityCard: React.FC = () => {
  const { weatherData } = useApp();
  if (!weatherData) return null;

  const { humidity, temp } = weatherData.current;
  
  // Dew Point Estimate formula: Td = T - ((100 - RH)/5)
  const dewPoint = temp - (100 - humidity) / 5;

  return (
    <div id="metric-humidity" className="p-5 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex flex-col justify-between h-full shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em] flex items-center gap-1.5">
          <Droplets size={14} className="text-cyan-300" />
          Humidity
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
          {humidity > 70 ? "Moist" : humidity < 35 ? "Dry" : "Optimal"}
        </span>
      </div>

      <div>
        <span className="text-4xl font-display font-extrabold text-white leading-none">
          {humidity}%
        </span>
        <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-cyan-300 h-1.5 rounded-full transition-all duration-1000" 
            style={{ width: `${humidity}%` }}
          ></div>
        </div>
      </div>

      <p className="text-[11px] text-white/60 mt-2 font-mono">
        Estimated Dew Point: {dewPoint.toFixed(1)}°C
      </p>
    </div>
  );
};

// --- Air Quality Card Component ---
export const AirQualityCard: React.FC = () => {
  const { weatherData } = useApp();
  if (!weatherData) return null;

  const aq = weatherData.airQuality;
  const aqiLabels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
  const aqiColors = [
    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "bg-green-500/20 text-green-300 border-green-500/30",
    "bg-amber-500/20 text-amber-300 border-amber-500/30",
    "bg-orange-500/20 text-orange-300 border-orange-500/30",
    "bg-red-500/20 text-red-300 border-red-500/30",
  ];

  return (
    <div id="metric-aqi" className="p-5 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 h-full flex flex-col justify-between shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em] flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-emerald-300" />
          Air Quality Index
        </span>
        <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-full ${aqiColors[aq.aqi - 1]}`}>
          {aqiLabels[aq.aqi - 1]}
        </span>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-2 font-mono text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-white/60">PM2.5</span>
            <span className="font-bold text-white/90">{aq.pm2_5.toFixed(1)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">PM10</span>
            <span className="font-bold text-white/90">{aq.pm10.toFixed(1)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Ozone</span>
            <span className="font-bold text-white/90">{aq.o3.toFixed(1)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">CO</span>
            <span className="font-bold text-white/90">{aq.co.toFixed(0)}</span>
          </div>
        </div>

        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
          <div 
            className={`h-full rounded-full ${aq.aqi <= 2 ? "bg-emerald-300" : aq.aqi === 3 ? "bg-amber-300" : "bg-red-300"}`}
            style={{ width: `${(aq.aqi / 5) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// --- UV Index Card Component ---
export const UVIndexCard: React.FC = () => {
  const { weatherData } = useApp();
  if (!weatherData) return null;

  const uv = weatherData.current.uvIndex;
  
  const getUvLevel = (uvVal: number) => {
    if (uvVal <= 2) return { label: "Low", color: "text-emerald-300 bg-emerald-500/20 border-emerald-500/30", advice: "Minimal skin risk." };
    if (uvVal <= 5) return { label: "Moderate", color: "text-amber-300 bg-amber-500/20 border-amber-500/30", advice: "Apply SPF 15+ block." };
    if (uvVal <= 7) return { label: "High", color: "text-orange-300 bg-orange-500/20 border-orange-500/30", advice: "Seek shade during midday." };
    return { label: "Very High", color: "text-red-300 bg-red-500/20 border-red-500/30", advice: "Limit direct outdoor sun." };
  };

  const level = getUvLevel(uv);

  return (
    <div id="metric-uv" className="p-5 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex flex-col justify-between h-full shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em] flex items-center gap-1.5">
          <Sun size={14} className="text-amber-300" />
          UV Sun Index
        </span>
        <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-full ${level.color}`}>
          {level.label}
        </span>
      </div>

      <div>
        <span className="text-4xl font-display font-extrabold text-white leading-none">
          {uv.toFixed(1)}
        </span>
        <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-amber-300 h-1.5 rounded-full transition-all duration-1000" 
            style={{ width: `${Math.min((uv / 12) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      <p className="text-[11px] text-white/60 mt-2 font-mono">
        {level.advice}
      </p>
    </div>
  );
};

// --- Sunrise & Sunset Card Component ---
export const SunriseSunsetCard: React.FC = () => {
  const { weatherData } = useApp();
  if (!weatherData) return null;

  const { sunrise, sunset } = weatherData.current;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div id="metric-sun" className="p-5 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex flex-col justify-between h-full shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em] flex items-center gap-1.5">
          <Sun size={14} className="text-yellow-300" />
          Astronomy Cycle
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-200 border border-yellow-500/30">
          Local Sol
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/30">
            <Sunrise size={18} />
          </div>
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Sunrise</p>
            <span className="text-sm font-semibold text-white font-mono">
              {formatTime(sunrise)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30">
            <Sunset size={18} />
          </div>
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Sunset</p>
            <span className="text-sm font-semibold text-white font-mono">
              {formatTime(sunset)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 mt-4 pt-3 flex items-center gap-2 text-xs text-white/60 font-mono">
        <Eye size={12} />
        <span>Visibility: {(weatherData.current.visibility / 1000).toFixed(1)} km</span>
      </div>
    </div>
  );
};
