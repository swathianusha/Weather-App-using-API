/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from "recharts";
import { useApp } from "../context/AppContext";
import { Sun, CloudRain } from "lucide-react";

export const TemperatureGraph: React.FC = () => {
  const { weatherData, settings } = useApp();
  const [chartMode, setChartMode] = useState<"temp" | "rain">("temp");

  if (!weatherData || !weatherData.hourly || weatherData.hourly.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-slate-400">
        Telemetry graph empty
      </div>
    );
  }

  // Format data for Recharts
  const data = weatherData.hourly.map((item) => {
    // Celsius internally, format appropriately
    const tempVal = settings.unit === "imperial" ? (item.temp * 9) / 5 + 32 : item.temp;
    return {
      time: item.time,
      temp: Number(tempVal.toFixed(1)),
      rain: Math.round(item.pop * 100),
      description: item.description,
    };
  });

  return (
    <div id="weather-telemetry-chart" className="p-5 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-slate-800/40 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            24-Hour Atmospheric Trends
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly projection for temperature and local cloud condensation
          </p>
        </div>

        {/* Toggle Mode buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start sm:self-center border border-slate-200/50 dark:border-slate-800">
          <button
            onClick={() => setChartMode("temp")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              chartMode === "temp"
                ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
            id="chart-mode-temp"
          >
            <Sun size={13} />
            Temperature
          </button>
          <button
            onClick={() => setChartMode("rain")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              chartMode === "rain"
                ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
            id="chart-mode-rain"
          >
            <CloudRain size={13} />
            Precipitation
          </button>
        </div>
      </div>

      <div className="w-full h-56" id="telemetry-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
            
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            
            <YAxis 
              stroke="#9ca3af" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              unit={chartMode === "temp" ? (settings.unit === "imperial" ? "°F" : "°C") : "%"}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15,23,42,0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#fff",
              }}
              formatter={(value: any) => [
                chartMode === "temp" ? `${value}°` : `${value}%`,
                chartMode === "temp" ? "Temperature" : "Precipitation Probability",
              ]}
              labelStyle={{ color: "#9ca3af", fontWeight: 600 }}
            />
            
            {chartMode === "temp" ? (
              <Area
                type="monotone"
                dataKey="temp"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#tempGradient)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "#f59e0b" }}
              />
            ) : (
              <Area
                type="monotone"
                dataKey="rain"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#rainGradient)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
