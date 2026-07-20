/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, AlertCircle, Sun, Moon, Laptop, RotateCcw, Mic, MicOff } from "lucide-react";
import { useApp } from "../context/AppContext";

// --- Theme Toggle Component ---
export const ThemeToggle: React.FC = () => {
  const { settings, updateSettings } = useApp();

  const themes: Array<{ name: "light" | "dark" | "system"; icon: React.ReactNode }> = [
    { name: "light", icon: <Sun size={15} /> },
    { name: "dark", icon: <Moon size={15} /> },
    { name: "system", icon: <Laptop size={15} /> },
  ];

  return (
    <div id="theme-toggle" className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/60 p-1 rounded-full border border-slate-300/40 dark:border-slate-700/50">
      {themes.map((t) => (
        <button
          key={t.name}
          onClick={() => updateSettings({ theme: t.name })}
          className={`p-1.5 rounded-full transition-all duration-200 capitalize text-xs flex items-center justify-center ${
            settings.theme === t.name
              ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm font-medium"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title={`Set theme to ${t.name}`}
          id={`theme-btn-${t.name}`}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
};

// --- Search Bar Component with Auto-Complete ---
export const SearchBar: React.FC = () => {
  const { fetchWeather, searchCities, fetchGPSLocation } = useApp();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ name: string; lat: number; lon: number; country: string; state?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Voice Search Web Speech API state
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Debounced search suggestions fetch
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCities(query);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch (e) {
        console.error("Geocoding failed:", e);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [query, searchCities]);

  // Voice Search Web Speech API Activation/Deactivation
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Speech recognition not supported in this browser.");
      setTimeout(() => setVoiceError(null), 4000);
      return;
    }

    setVoiceError(null);
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          // clean trailing dots or punctuation Web Speech API might introduce
          const cleanTranscript = transcript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
          setQuery(cleanTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setVoiceError("Microphone permission denied.");
        } else if (event.error === "no-speech") {
          setVoiceError("No speech detected. Try again.");
        } else {
          setVoiceError(`Voice error: ${event.error}`);
        }
        setTimeout(() => setVoiceError(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error("Failed to start speech recognition:", e);
      setVoiceError("Failed to start voice search.");
      setTimeout(() => setVoiceError(null), 4000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSelect = async (loc: any) => {
    setQuery("");
    setShowDropdown(false);
    const label = loc.state ? `${loc.name}, ${loc.state}` : loc.name;
    await fetchWeather(loc.lat, loc.lon, label);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchCities(query);
      if (results && results.length > 0) {
        await handleSelect(results[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto" ref={dropdownRef} id="search-container">
      {/* Absolute Voice Error Tooltip */}
      {voiceError && (
        <div 
          className="absolute -top-11 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl bg-red-500/90 backdrop-blur-md border border-red-500/20 text-white text-xs font-mono font-bold shadow-lg flex items-center gap-1.5 animate-bounce z-50 whitespace-nowrap"
          id="voice-error-tooltip"
        >
          <AlertCircle size={12} />
          <span>{voiceError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isListening ? "Listening... Speak a city name..." : "Search city or ZIP code..."}
            className={`w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-300/50 dark:border-slate-800/80 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm ${
              isListening ? "ring-2 ring-red-500/50 border-red-500" : ""
            }`}
            id="search-input"
          />
          <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" size={16} />
          {isSearching && (
            <Loader2 className="absolute right-3.5 top-3 text-slate-400 animate-spin" size={16} />
          )}
        </div>
        <button
          type="button"
          onClick={toggleListening}
          className={`p-2.5 rounded-2xl border transition-all duration-300 active:scale-95 flex items-center justify-center ${
            isListening
              ? "bg-red-500 border-red-600 text-white animate-pulse shadow-md shadow-red-500/30"
              : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-md shadow-indigo-500/20"
          }`}
          title={isListening ? "Listening... Click to stop" : "Voice Search (Speak a city name)"}
          id="voice-search-btn"
        >
          {isListening ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
        </button>
        <button
          type="button"
          onClick={fetchGPSLocation}
          className="p-2.5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center"
          title="Use current GPS location"
          id="gps-btn"
        >
          <MapPin size={18} />
        </button>
      </form>

      {/* Suggestion Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div 
          className="absolute left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800"
          id="search-suggestions"
        >
          {suggestions.map((loc, idx) => (
            <button
              key={`${loc.lat}-${loc.lon}-${idx}`}
              onClick={() => handleSelect(loc)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  {loc.name}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {loc.state ? `${loc.state}, ` : ""}{loc.country}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                {loc.lat.toFixed(2)}N, {loc.lon.toFixed(2)}E
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Beautiful Loader Component ---
export const Loader: React.FC = () => {
  const loaderStrings = [
    "Consulting tropospheric sensors...",
    "Scanning atmospheric conditions...",
    "Synthesizing high-altitude readings...",
    "Engaging Gemini AI Weather insights...",
  ];
  
  const [messageIdx, setMessageIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % loaderStrings.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="app-loader" className="flex flex-col items-center justify-center p-12 min-h-[400px]">
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-16 h-16 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin"></div>
        <Loader2 className="absolute text-blue-500 animate-pulse" size={24} />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse text-center">
        {loaderStrings[messageIdx]}
      </p>
    </div>
  );
};

// --- Error Component ---
interface ErrorComponentProps {
  message: string;
}

export const ErrorComponent: React.FC<ErrorComponentProps> = ({ message }) => {
  const { fetchWeather } = useApp();

  return (
    <div id="error-card" className="max-w-md mx-auto my-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-md text-center">
      <AlertCircle className="mx-auto text-red-500 mb-4 animate-bounce" size={40} />
      <h3 className="font-semibold text-lg text-red-600 dark:text-red-400 mb-2">Weather Sync Failed</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {message}
      </p>
      <button
        onClick={() => fetchWeather(40.7128, -74.0060, "New York")}
        className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
        id="error-retry-btn"
      >
        <RotateCcw size={14} />
        Reset to New York
      </button>
    </div>
  );
};

// --- Footer Component ---
export const Footer: React.FC = () => {
  return (
    <footer className="text-center py-8 mt-12 border-t border-slate-200/40 dark:border-slate-800/50" id="app-footer">
      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
        Full Stack Weather Applet &bull; Powered by OpenWeatherMap API &amp; Gemini 3.5 AI
      </p>
      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-600 mt-1.5">
        Designed with custom glassmorphism components
      </p>
    </footer>
  );
};
