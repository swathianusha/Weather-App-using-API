/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { User, UserSettings, FavoriteCity, SearchHistoryItem, WeatherPayload } from "../types";

const DB_FILE = path.join(process.cwd(), "local_db.json");

interface LocalSchema {
  users: User[];
  settings: UserSettings[];
  favorites: FavoriteCity[];
  searchHistory: SearchHistoryItem[];
  cachedWeather: Record<string, { data: WeatherPayload; expiresAt: number }>;
}

const DEFAULT_DB: LocalSchema = {
  users: [],
  settings: [],
  favorites: [],
  searchHistory: [],
  cachedWeather: {},
};

class DBService {
  private initialized = false;
  private data: LocalSchema = { ...DEFAULT_DB };

  private async ensureInitialized() {
    if (this.initialized) return;

    try {
      await fs.access(DB_FILE);
      const content = await fs.readFile(DB_FILE, "utf-8");
      this.data = JSON.parse(content);
    } catch {
      // File doesn't exist, create it with default state
      this.data = { ...DEFAULT_DB };
      await this.save();
    }
    this.initialized = true;
  }

  private async save() {
    try {
      await fs.writeFile(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save database file:", error);
    }
  }

  // --- Users CRUD ---

  public async createUser(name: string, email: string, passwordPlain: string): Promise<User> {
    await this.ensureInitialized();
    const normalizedEmail = email.toLowerCase().trim();

    if (this.data.users.some((u) => u.email === normalizedEmail)) {
      throw new Error("User with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    const newUser: User = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);

    // Initialize default user settings
    const defaultSettings: UserSettings = {
      userId: newUser.id,
      unit: "metric",
      windUnit: "kmh",
      theme: "dark",
      notifications: true,
    };
    this.data.settings.push(defaultSettings);

    await this.save();
    return newUser;
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    await this.ensureInitialized();
    const normalizedEmail = email.toLowerCase().trim();
    const user = this.data.users.find((u) => u.email === normalizedEmail);
    return user || null;
  }

  public async getUserById(id: string): Promise<User | null> {
    await this.ensureInitialized();
    const user = this.data.users.find((u) => u.id === id);
    return user || null;
  }

  public async verifyPassword(user: User, passwordPlain: string): Promise<boolean> {
    return bcrypt.compare(passwordPlain, user.passwordHash);
  }

  // --- Settings CRUD ---

  public async getSettings(userId: string): Promise<UserSettings> {
    await this.ensureInitialized();
    let setting = this.data.settings.find((s) => s.userId === userId);
    if (!setting) {
      // Create default on-the-fly if not found
      setting = {
        userId,
        unit: "metric",
        windUnit: "kmh",
        theme: "dark",
        notifications: true,
        backgroundStyle: "adaptive",
      };
      this.data.settings.push(setting);
      await this.save();
    }
    return setting;
  }

  public async updateSettings(userId: string, updates: Partial<Omit<UserSettings, "userId">>): Promise<UserSettings> {
    await this.ensureInitialized();
    let index = this.data.settings.findIndex((s) => s.userId === userId);
    if (index === -1) {
      const newSettings: UserSettings = {
        userId,
        unit: updates.unit || "metric",
        windUnit: updates.windUnit || "kmh",
        theme: updates.theme || "dark",
        notifications: updates.notifications ?? true,
        backgroundStyle: updates.backgroundStyle || "adaptive",
      };
      this.data.settings.push(newSettings);
      index = this.data.settings.length - 1;
    } else {
      this.data.settings[index] = {
        ...this.data.settings[index],
        ...updates,
      };
    }
    await this.save();
    return this.data.settings[index];
  }

  // --- Favorites CRUD ---

  public async getFavorites(userId: string): Promise<FavoriteCity[]> {
    await this.ensureInitialized();
    return this.data.favorites.filter((f) => f.userId === userId);
  }

  public async addFavorite(
    userId: string,
    cityName: string,
    lat: number,
    lon: number,
    country?: string,
    state?: string
  ): Promise<FavoriteCity> {
    await this.ensureInitialized();
    
    // Check if already favorited
    const existing = this.data.favorites.find(
      (f) => f.userId === userId && f.lat === lat && f.lon === lon
    );
    if (existing) return existing;

    const newFavorite: FavoriteCity = {
      id: Math.random().toString(36).substring(2, 11),
      userId,
      cityName,
      lat,
      lon,
      country,
      state,
      createdAt: new Date().toISOString(),
    };

    this.data.favorites.push(newFavorite);
    await this.save();
    return newFavorite;
  }

  public async removeFavorite(userId: string, favoriteId: string): Promise<boolean> {
    await this.ensureInitialized();
    const originalLength = this.data.favorites.length;
    this.data.favorites = this.data.favorites.filter(
      (f) => !(f.userId === userId && f.id === favoriteId)
    );
    const success = this.data.favorites.length < originalLength;
    if (success) {
      await this.save();
    }
    return success;
  }

  // --- Search History CRUD ---

  public async getSearchHistory(userId: string): Promise<SearchHistoryItem[]> {
    await this.ensureInitialized();
    return this.data.searchHistory
      .filter((h) => h.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async addSearchHistory(
    userId: string,
    query: string,
    cityName: string,
    lat: number,
    lon: number,
    country?: string,
    state?: string
  ): Promise<SearchHistoryItem> {
    await this.ensureInitialized();

    // Prevent duplicates in history
    this.data.searchHistory = this.data.searchHistory.filter(
      (h) => !(h.userId === userId && h.cityName === cityName && h.lat === lat && h.lon === lon)
    );

    const newHistory: SearchHistoryItem = {
      id: Math.random().toString(36).substring(2, 11),
      userId,
      query,
      cityName,
      lat,
      lon,
      country,
      state,
      createdAt: new Date().toISOString(),
    };

    this.data.searchHistory.push(newHistory);

    // Limit search history to 15 items per user
    const userHistory = this.data.searchHistory.filter((h) => h.userId === userId);
    if (userHistory.length > 15) {
      const itemsToRemove = userHistory
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, userHistory.length - 15);
      
      const idsToRemove = new Set(itemsToRemove.map((item) => item.id));
      this.data.searchHistory = this.data.searchHistory.filter((h) => !idsToRemove.has(h.id));
    }

    await this.save();
    return newHistory;
  }

  public async clearSearchHistory(userId: string): Promise<boolean> {
    await this.ensureInitialized();
    const originalLength = this.data.searchHistory.length;
    this.data.searchHistory = this.data.searchHistory.filter((h) => h.userId !== userId);
    const changed = this.data.searchHistory.length < originalLength;
    if (changed) {
      await this.save();
    }
    return changed;
  }

  // --- Weather Cache CRUD ---

  public async getCachedWeather(lat: number, lon: number): Promise<WeatherPayload | null> {
    await this.ensureInitialized();
    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    const cache = this.data.cachedWeather[key];
    if (cache && cache.expiresAt > Date.now()) {
      return cache.data;
    }
    return null;
  }

  public async cacheWeather(lat: number, lon: number, data: WeatherPayload, ttlSeconds = 900): Promise<void> {
    await this.ensureInitialized();
    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    this.data.cachedWeather[key] = {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    };
    await this.save();
  }
}

export const dbService = new DBService();
