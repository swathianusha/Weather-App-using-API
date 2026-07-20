# SolCast - Full-Stack AI Weather Application

SolCast is a feature-rich, full-stack weather application built with a modern React SPA frontend and a robust Node.js + Express backend. SolCast leverages the Google Gemini 3.5 Flash API on the server-side to generate context-aware weather insights, and integrates the OpenWeatherMap API for live geocoding and real-time multi-dimensional weather data.

To guarantee zero setup friction, the system incorporates a **Smart Simulation Mode**: if no external API credentials are provided, SolCast dynamically generates realistic geocoding data and sinusoidal climate simulations so that the application runs, visualizes, and behaves perfectly right out of the box.

---

## 🚀 Key Features

### 💻 Frontend & User Experience
- **Responsive Dashboard**: Bento-grid metrics, dynamic weather summary blocks, and astronomy cycles.
- **Dynamic Weather Backgrounds**: Modulates layout gradients and visual backdrops based on current conditions.
- **Gemini AI Weather Insights**: Receives tailored clothing, safety precautions, and activity advice.
- **7-Day Meteorological Outlook**: Collapsible day listings showcasing detailed forecast details.
- **Hourly Trends & Telemetry**: Interactive, responsive smooth bezier area charts powered by **Recharts**.
- **Favorite Locations Grid**: Logged-in users can save cities to instantly view current temperatures.
- **Chronological Search History**: Keeps track of recent geolocations looked up.
- **Unified Unit Switching**: On-the-fly toggles between Celsius (°C) and Fahrenheit (°F) with immediate layout updates.
- **Apperance Themes**: Seamless light, dark, and system-default appearance options.

### ⚙️ Backend & Architecture
- **MVC Route Architecture**: Modular separation of authentication, weather retrieval, search history, and favorites.
- **JSON DB Fallback**: Utilizes a self-contained, atomic file-based database (`local_db.json`) for instant preview compatibility, with easy plug-and-play scaling to **MongoDB Atlas**.
- **Protected API Routes**: Secures endpoints with JSON Web Tokens (JWT) and bcrypt password-hashing.
- **API Cache Handler**: Automatically caches geocoding and weather queries (15-minute TTL) to minimize third-party API quotas.
- **Strict Key Security**: Executes Gemini and OpenWeatherMap queries purely server-side to prevent browser exposure.

---

## 📁 System Folder Structure

```text
weather-app/
├── server.ts              # Express.js entry point (handles API routes & Vite middleware)
├── package.json           # Scripts and dependency manifests
├── tsconfig.json          # TypeScript compilation settings
├── vite.config.ts         # Vite server configuration
├── metadata.json          # AI Studio applet permissions & capabilities
├── local_db.json          # Atomic file database (automatically created on first run)
│
├── src/
│   ├── main.tsx           # React DOM bootstrapping entry point
│   ├── App.tsx            # Central layout, tab router, and context wrapper
│   ├── index.css          # Tailwind CSS global stylesheet & custom font family declarations
│   ├── types.ts           # Unified TypeScript interfaces for weather and auth states
│   │
│   ├── context/
│   │   └── AppContext.tsx # React Context manager (handles geolocation, auth, caching & conversions)
│   │
│   ├── services/
│   │   ├── weatherService.ts # OpenWeather API client & sinusoidal simulation engine
│   │   └── geminiService.ts  # Google GenAI model router & fallback insights generator
│   │
│   └── components/
│       ├── Common.tsx        # SearchBar, Loader, ErrorComponent, Footer & ThemeToggle
│       ├── WeatherIcons.tsx  # Dynamic condition-to-icon mapping and background themes
│       ├── WeatherMetrics.tsx# Wind compass, Humidity, AQI, UV, and Sunrise/Sunset cards
│       ├── WeatherCharts.tsx # Recharts-powered temperature & POP hourly area graphs
│       ├── AuthModal.tsx     # Animated slide-up glassmorphic login/register overlay
│       ├── Navigation.tsx    # Responsive side navigation panel and mobile headers
│       └── Pages.tsx         # DashboardPage, ForecastPage, HourlyPage, FavoritesPage, etc.
```

---

## 🔌 API Documentation (REST endpoints)

All backend endpoints are prefixed with `/api`. Auth-restricted routes require an `Authorization: Bearer <JWT_Token>` header.

### 1. Authentication
* **`POST /api/auth/register`**
  - **Payload**: `{ "name": "John Doe", "email": "john@example.com", "password": "securepassword" }`
  - **Response**: Returns a 201 status code with a signed JWT token, user credentials, and default unit settings.
* **`POST /api/auth/login`**
  - **Payload**: `{ "email": "john@example.com", "password": "securepassword" }`
  - **Response**: Returns a 200 status with signed JWT and current user settings.
* **`GET /api/auth/me`** (Protected)
  - **Response**: Returns the verified user object.

### 2. Weather
* **`GET /api/weather/search?q={query}`**
  - **Response**: Array of geolocated cities. E.g., `[{ "name": "London", "lat": 51.5074, "lon": -0.1278, "country": "GB" }]`.
* **`GET /api/weather/data?lat={lat}&lon={lon}&cityName={label}`**
  - **Response**: Standardized `WeatherPayload` merging current parameters, 24h hourly segments, 7-day outlooks, and localized Air Quality indices.
* **`GET /api/weather/insights?lat={lat}&lon={lon}`**
  - **Response**: JSON structure containing Google Gemini AI-powered weather clothing suggestions, activity plans, precautions, and a summary.

### 3. Favorites & Search History (Protected)
* **`GET /api/favorites`** / **`POST /api/favorites`** / **`DELETE /api/favorites/:id`**
  - Manages the user's custom favorite geolocated coordinates.
* **`GET /api/history`** / **`POST /api/history`** / **`DELETE /api/history`**
  - Manages recently visited coordinates.

---

## 🛠️ Installation & Setup Guide

### 1. Clone the project and install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```env
# Google Gemini API key (Accessed via Settings > Secrets in AI Studio)
GEMINI_API_KEY="your_google_gemini_api_key"

# OpenWeatherMap API key (Leave blank to run in mock simulation mode)
OPENWEATHER_API_KEY="your_openweather_api_key"

# Secret salt used to sign JWTs
JWT_SECRET="your_secure_random_jwt_secret"
```

### 3. Start Development Server
This boots our unified Express server, loading the Vite SPA as a dynamic hot-rebuilding middleware:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
This compiles the client-side bundles and bundles the backend server into a standalone self-contained CJS bundle in `dist/`:
```bash
npm run build
npm start
```

---

## ☁️ Deployment Guidelines

### 🗄️ Database: MongoDB Atlas (Optional)
If scaling past the default `local_db.json` file database:
1. Provision a free M1 tier database on MongoDB Atlas.
2. Under "Network Access", allow connection IPs.
3. Retrieve your connection URI string.
4. Set `MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.mongodb.net/solcast"` in your environment variables.

### 🖥️ Backend: Render / Cloud Run
To deploy the Express backend:
1. Connect your GitHub repository to Render.
2. Select **Web Service** environment.
3. Configure the following build variables:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Define your production environment variables: `GEMINI_API_KEY`, `OPENWEATHER_API_KEY`, and `JWT_SECRET`.

### 🎨 Frontend: Vercel / Netlify
Since the Express server serves the compiled React assets directly out of `/dist` in production, you can simply deploy the entire repository as a single unified service on Render or Cloud Run. 

If hosting the frontend as a pure client-side SPA separately on Vercel:
1. Configure Vercel to point to `/dist` as the build output directory.
2. Set the build command as `vite build` and install dependencies.
3. Update the frontend fetch endpoints to point to your deployed backend URL.

---

## 🛡️ Secure Practices
- **Server API Proxies**: All geocoding, OpenWeatherMap, and Gemini GenAI connections are made server-side. Under no circumstances are the API keys exposed to client browser bundles.
- **Lazy Initialization**: The Gemini client initializes lazily only when first requested, preventing startup crashes.
- **Bcrypt Hashing**: User passwords are encrypted with individual dynamic salt factors on registration before saving to persistence.
