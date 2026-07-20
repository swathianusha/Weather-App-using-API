/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { dbService } from "./src/db/dbService";
import { searchLocation, reverseGeocode, getWeatherData } from "./src/services/weatherService";
import { generateWeatherInsights } from "./src/services/geminiService";

// Extend Express Request type to support auth user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_weather_token";
const PORT = 3000;

async function startServer() {
  const app = express();
  
  // Enable parsing of JSON bodies
  app.use(express.json());

  // --- Middleware: JWT Authentication Guard ---
  function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
      if (err) {
        res.status(403).json({ error: "Invalid or expired access token" });
        return;
      }
      req.user = {
        id: decoded.id,
        email: decoded.email,
      };
      next();
    });
  }

  // --- API Routes: AUTH ---

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ error: "Name, email and password are required" });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters long" });
        return;
      }

      const user = await dbService.createUser(name, email, password);
      const settings = await dbService.getSettings(user.id);
      
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

      res.status(201).json({
        token,
        user: { id: user.id, email: user.email, name: user.name },
        settings,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const user = await dbService.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const isValidPassword = await dbService.verifyPassword(user, password);
      if (!isValidPassword) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const settings = await dbService.getSettings(user.id);
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

      res.status(200).json({
        token,
        user: { id: user.id, email: user.email, name: user.name },
        settings,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Authentication failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const user = await dbService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const settings = await dbService.getSettings(userId);
      res.status(200).json({
        user: { id: user.id, email: user.email, name: user.name },
        settings,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- API Routes: WEATHER RETRIEVAL ---

  app.get("/api/weather/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        res.status(400).json({ error: "Search query is required" });
        return;
      }
      const locations = await searchLocation(query);
      res.status(200).json(locations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/weather/reverse", async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);

      if (isNaN(lat) || isNaN(lon)) {
        res.status(400).json({ error: "Valid lat and lon are required" });
        return;
      }

      const location = await reverseGeocode(lat, lon);
      if (!location) {
        res.status(404).json({ error: "No location found for coordinates" });
        return;
      }

      res.status(200).json(location);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/weather/data", async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const cityName = req.query.cityName as string;

      if (isNaN(lat) || isNaN(lon)) {
        res.status(400).json({ error: "Valid lat and lon are required" });
        return;
      }

      const weather = await getWeatherData(lat, lon, cityName);
      res.status(200).json(weather);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/weather/insights", async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const cityName = req.query.cityName as string;

      if (isNaN(lat) || isNaN(lon)) {
        res.status(400).json({ error: "Valid lat and lon are required" });
        return;
      }

      const weather = await getWeatherData(lat, lon, cityName);
      const insights = await generateWeatherInsights(weather);
      res.status(200).json(insights);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- API Routes: FAVORITES (Protected) ---

  app.get("/api/favorites", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const favorites = await dbService.getFavorites(userId);
      res.status(200).json(favorites);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/favorites", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { cityName, lat, lon, country, state } = req.body;
      
      if (!cityName || lat === undefined || lon === undefined) {
        res.status(400).json({ error: "cityName, lat, and lon are required" });
        return;
      }

      const favorite = await dbService.addFavorite(userId, cityName, lat, lon, country, state);
      res.status(201).json(favorite);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/favorites/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const favoriteId = req.params.id;

      const success = await dbService.removeFavorite(userId, favoriteId);
      if (!success) {
        res.status(404).json({ error: "Favorite not found or not owned by you" });
        return;
      }

      res.status(200).json({ success: true, message: "Removed from favorites" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- API Routes: SEARCH HISTORY (Protected) ---

  app.get("/api/history", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const history = await dbService.getSearchHistory(userId);
      res.status(200).json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/history", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { query, cityName, lat, lon, country, state } = req.body;

      if (!query || !cityName || lat === undefined || lon === undefined) {
        res.status(400).json({ error: "query, cityName, lat, and lon are required" });
        return;
      }

      const item = await dbService.addSearchHistory(userId, query, cityName, lat, lon, country, state);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/history", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      await dbService.clearSearchHistory(userId);
      res.status(200).json({ success: true, message: "Search history cleared" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- API Routes: SETTINGS (Protected) ---

  app.get("/api/settings", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const settings = await dbService.getSettings(userId);
      res.status(200).json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/settings", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { unit, windUnit, theme, notifications, backgroundStyle } = req.body;

      const updated = await dbService.updateSettings(userId, { unit, windUnit, theme, notifications, backgroundStyle });
      res.status(200).json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Setup Static Frontend Serving & Vite HMR Integration ---

  if (process.env.NODE_ENV !== "production") {
    // Mount Vite development server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    // Serve static compiled SPA files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist.");
  }

  // Bind to host 0.0.0.0 and port 3000 as required
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical server startup crash:", error);
});
