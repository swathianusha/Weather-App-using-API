/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Sun, Cloud, CloudRain, CloudLightning, CloudSnow, 
  CloudDrizzle, Wind, HelpCircle, SunDim, Eye, Compass, Droplets, Thermometer, Flame, Sunrise, Sunset
} from "lucide-react";

interface WeatherIconProps {
  iconCode: string;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ iconCode, className = "", size = 48 }) => {
  const code = iconCode.replace(/[dn]/g, ""); // strip day/night suffix for general matching

  switch (code) {
    case "01": // Clear Sky
      return <Sun className={`text-amber-500 animate-[spin_60s_linear_infinite] ${className}`} size={size} />;
    case "02": // Few Clouds
      return <SunDim className={`text-amber-400 ${className}`} size={size} />;
    case "03": // Scattered Clouds
      return <Cloud className={`text-slate-400 dark:text-slate-300 animate-float ${className}`} size={size} />;
    case "04": // Broken / Overcast Clouds
      return <Cloud className={`text-slate-500 dark:text-slate-400 animate-pulse ${className}`} size={size} />;
    case "09": // Shower Rain
      return <CloudDrizzle className={`text-cyan-400 ${className}`} size={size} />;
    case "10": // Rain
      return <CloudRain className={`text-blue-500 ${className}`} size={size} />;
    case "11": // Thunderstorm
      return <CloudLightning className={`text-indigo-500 dark:text-indigo-400 ${className}`} size={size} />;
    case "13": // Snow
      return <CloudSnow className={`text-teal-300 ${className}`} size={size} />;
    case "50": // Mist / Fog
      return <Wind className={`text-emerald-400 ${className}`} size={size} />;
    default:
      return <HelpCircle className={`text-gray-400 ${className}`} size={size} />;
  }
};

export interface WeatherTheme {
  gradient: string;
  cardBg: string;
  border: string;
  textColor: string;
  accent: string;
  glow: string;
}

/**
 * Generates custom backdrop theme styles based on weather state in a high-end Editorial Aesthetic
 */
export function getWeatherTheme(condition: string = "Clear"): WeatherTheme {
  const cond = condition.toLowerCase();

  if (cond.includes("clear")) {
    return {
      gradient: "from-[#1a2a6c] via-[#b21f1f] to-[#fdbb2d]",
      cardBg: "bg-white/10 backdrop-blur-xl",
      border: "border-white/20",
      textColor: "text-white",
      accent: "text-[#fdbb2d]",
      glow: "shadow-2xl shadow-[#b21f1f]/20",
    };
  }

  if (cond.includes("cloud") || cond.includes("mist") || cond.includes("fog")) {
    return {
      gradient: "from-[#2c3e50] via-[#4a5664] to-[#bdc3c7]",
      cardBg: "bg-white/10 backdrop-blur-xl",
      border: "border-white/15",
      textColor: "text-white",
      accent: "text-slate-200",
      glow: "shadow-2xl shadow-slate-900/20",
    };
  }

  if (cond.includes("rain") || cond.includes("drizzle")) {
    return {
      gradient: "from-[#0f2027] via-[#203a43] to-[#2c5364]",
      cardBg: "bg-white/10 backdrop-blur-xl",
      border: "border-white/15",
      textColor: "text-white",
      accent: "text-cyan-300",
      glow: "shadow-2xl shadow-cyan-950/20",
    };
  }

  if (cond.includes("storm") || cond.includes("thunder")) {
    return {
      gradient: "from-[#1f1c2c] via-[#4c3c5c] to-[#928dab]",
      cardBg: "bg-white/10 backdrop-blur-xl",
      border: "border-white/15",
      textColor: "text-white",
      accent: "text-purple-300",
      glow: "shadow-2xl shadow-purple-950/35",
    };
  }

  if (cond.includes("snow") || cond.includes("ice") || cond.includes("freeze")) {
    return {
      gradient: "from-[#0f172a] via-[#1e293b] to-[#475569]",
      cardBg: "bg-white/10 backdrop-blur-xl",
      border: "border-white/20",
      textColor: "text-white",
      accent: "text-blue-200",
      glow: "shadow-2xl shadow-blue-900/10",
    };
  }

  // Default Editorial Dawn-Dusk
  return {
    gradient: "from-[#1a2a6c] via-[#b21f1f] to-[#fdbb2d]",
    cardBg: "bg-white/10 backdrop-blur-xl",
    border: "border-white/20",
    textColor: "text-white",
    accent: "text-[#fdbb2d]",
    glow: "shadow-2xl shadow-black/20",
  };
}
