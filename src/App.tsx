/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Navigation } from "./components/Navigation";
import { SearchBar, Loader, ErrorComponent, Footer } from "./components/Common";
import { 
  DashboardPage, ForecastPage, HourlyPage, FavoritesPage, HistoryPage, SettingsPage, AboutPage 
} from "./components/Pages";
import { getWeatherTheme } from "./components/WeatherIcons";

const MainAppContent: React.FC = () => {
  const { activeTab, isLoadingWeather, weatherError, weatherData, settings } = useApp();

  // Active view router
  const renderActivePage = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage />;
      case "forecast":
        return <ForecastPage />;
      case "hourly":
        return <HourlyPage />;
      case "favorites":
        return <FavoritesPage />;
      case "history":
        return <HistoryPage />;
      case "settings":
        return <SettingsPage />;
      case "about":
        return <AboutPage />;
      default:
        return <DashboardPage />;
    }
  };

  // Extract condition and get theme
  const condition = weatherData?.current?.mainCondition || "Clear";
  const theme = getWeatherTheme(condition);

  // Background style selection mapper
  const getBackgroundGradient = () => {
    const bgStyle = settings.backgroundStyle || "adaptive";
    switch (bgStyle) {
      case "midnight":
        return "from-[#020617] via-[#0f172a] to-[#1e293b]";
      case "nordic":
        return "from-[#1e293b] via-[#334155] to-[#0f172a]";
      case "forest":
        return "from-[#022c22] via-[#064e3b] to-[#022c22]";
      case "sunset":
        return "from-[#450a0a] via-[#7c2d12] to-[#78350f]";
      case "neon":
        return "from-[#1e1b4b] via-[#311042] to-[#1e1b4b]";
      case "adaptive":
      default:
        return theme.gradient;
    }
  };

  return (
    <div 
      id="weather-app-layout" 
      className={`flex flex-col md:flex-row min-h-screen bg-gradient-to-br ${getBackgroundGradient()} text-white transition-all duration-700 ease-in-out font-sans`}
    >
      {/* Navigation sidebar (or mobile top-header) */}
      <Navigation />

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-h-screen">
        <div className="space-y-6 w-full">
          {/* Central Top Search & Location panel */}
          <SearchBar />

          {/* Conditional state render overlay */}
          {isLoadingWeather ? (
            <Loader />
          ) : weatherError ? (
            <ErrorComponent message={weatherError} />
          ) : (
            <div id="view-fade-wrapper" className="animate-fade-in">
              {renderActivePage()}
            </div>
          )}
        </div>

        {/* Global Footer credits */}
        <Footer />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

