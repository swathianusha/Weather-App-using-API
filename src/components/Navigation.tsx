/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  CloudSun, LayoutDashboard, Calendar, Clock, Heart, History, Settings, Info, LogIn, LogOut, User, Menu, X 
} from "lucide-react";
import { useApp, TabName } from "../context/AppContext";
import { ThemeToggle } from "./Common";
import { AuthModal } from "./AuthModal";

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, user, logout } = useApp();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems: Array<{ id: TabName; label: string; icon: React.ReactNode }> = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "forecast", label: "7-Day Forecast", icon: <Calendar size={18} /> },
    { id: "hourly", label: "Hourly Trends", icon: <Clock size={18} /> },
    { id: "favorites", label: "Favorite Cities", icon: <Heart size={18} /> },
    { id: "history", label: "Search History", icon: <History size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
    { id: "about", label: "About App", icon: <Info size={18} /> },
  ];

  const handleTabClick = (tabId: TabName) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* HEADER BAR (Mobile & Tablet) */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40" id="mobile-header">
        <div className="flex items-center gap-2">
          <CloudSun className="text-cyan-300 animate-pulse" size={26} />
          <span className="font-display font-black text-lg text-white leading-none tracking-widest uppercase">
            SolCast
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-white/10 border border-white/20 text-white"
            id="mobile-menu-toggle"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* MOBILE NAV OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-[65px] bottom-0 bg-slate-950/70 backdrop-blur-sm z-30 md:hidden animate-fade-in" id="mobile-overlay-menu">
          <div className="bg-slate-900/95 border-b border-white/10 p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors ${
                  activeTab === item.id
                    ? "bg-white text-slate-900 shadow-lg"
                    : "text-white/70 hover:bg-white/10"
                }`}
                id={`mobile-tab-${item.id}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            {/* Profile segment mobile */}
            <div className="border-t border-white/10 mt-4 pt-4">
              {user ? (
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-white leading-tight">{user.name}</span>
                      <span className="text-[10px] text-white/60 leading-none mt-0.5">{user.email}</span>
                    </div>
                  </div>
                  <button onClick={logout} className="p-2 rounded-xl text-red-400 hover:bg-white/10" id="mobile-logout-btn">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsAuthOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 text-white text-sm font-semibold border border-white/25 hover:bg-white/15"
                  id="mobile-login-btn"
                >
                  <LogIn size={16} />
                  Connect Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR (md:screen and up) */}
      <aside 
        className="hidden md:flex flex-col justify-between w-64 h-screen bg-black/20 backdrop-blur-xl border-r border-white/10 p-6 sticky top-0 shrink-0 z-10"
        id="desktop-sidebar"
      >
        <div className="space-y-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2">
            <CloudSun className="text-cyan-300 animate-pulse" size={32} />
            <div className="flex flex-col">
              <span className="font-display font-black text-xl text-white leading-none tracking-widest uppercase">
                SolCast
              </span>
              <span className="text-[9px] text-[#fdbb2d] font-bold uppercase tracking-[0.2em] mt-1.5">
                Full-Stack
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" id="desktop-menu-links">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                  activeTab === item.id
                    ? "bg-white text-slate-900 shadow-lg scale-[1.02]"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
                id={`desktop-tab-${item.id}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* User profile & Settings Footer */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Appearance</span>
            <ThemeToggle />
          </div>

          <div className="border-t border-white/10 pt-4">
            {user ? (
              <div className="flex items-center justify-between p-2.5 bg-white/10 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-xs font-bold text-white truncate leading-none">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-white/60 truncate leading-none mt-1">
                      {user.email}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={logout} 
                  className="p-1.5 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors shrink-0" 
                  title="Sign out"
                  id="desktop-logout-btn"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 text-white hover:bg-white/15 border border-white/25 text-xs font-bold transition-all shadow-sm active:scale-98"
                id="desktop-login-btn"
              >
                <LogIn size={15} />
                Connect Account
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Renders Auth Modal overlay */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};
