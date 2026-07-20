/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { WeatherPayload } from "../types";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export interface WeatherInsights {
  clothing: string;
  activities: string;
  precautions: string;
  summary: string;
}

/**
 * Generates custom AI weather recommendations and summaries
 */
export async function generateWeatherInsights(weather: WeatherPayload): Promise<WeatherInsights> {
  const client = getAiClient();
  const c = weather.current;
  const aqiMap = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
  const aqiString = aqiMap[(weather.airQuality?.aqi || 1) - 1];

  const prompt = `
Analyze the following weather details for ${c.cityName}, ${c.country}:
- Temperature: ${c.temp.toFixed(1)}°C (Feels like: ${c.feelsLike.toFixed(1)}°C)
- Condition: ${c.description} (${c.mainCondition})
- Humidity: ${c.humidity}%
- Wind Speed: ${c.windSpeed} m/s
- UV Index: ${c.uvIndex.toFixed(1)}
- Air Quality: ${aqiString} (Index: ${weather.airQuality?.aqi || 1})
- Active Alerts: ${weather.alerts?.map(a => `${a.event}: ${a.description}`).join("; ") || "None"}

Please generate a highly engaging, context-aware response in JSON format. Provide the following exactly:
1. clothing: What specific types of clothing, layers, and footwear are recommended.
2. activities: Whether outdoor or indoor activities are better suited, with 2-3 specific fun ideas matching this climate.
3. precautions: Health or safety advice (e.g. sunscreen SPF, hydration, allergy warnings, or weather alert precautions).
4. summary: A short, witty, or poetic one-sentence summary of the weather.

Respond ONLY with a valid JSON object matching this schema. Do not include markdown code block characters like \`\`\`json.
{
  "clothing": "string",
  "activities": "string",
  "precautions": "string",
  "summary": "string"
}
  `.trim();

  if (!client) {
    // Generate beautiful static fallback insights based on weather conditions
    return generateStaticFallbackInsights(weather);
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    // Clean JSON characters if model accidentally returns markdown wrappers
    const cleanedJson = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("Gemini AI failed to generate weather insights, using static fallback:", error);
    return generateStaticFallbackInsights(weather);
  }
}

/**
 * Highly customized weather fallback generator
 */
function generateStaticFallbackInsights(weather: WeatherPayload): WeatherInsights {
  const c = weather.current;
  const isImperial = false; // Internal conversion is handled in UI, raw data is metric

  let clothing = "";
  let activities = "";
  let precautions = "";
  let summary = "";

  if (c.temp > 28) {
    clothing = "Wear loose, light-colored cotton or linen clothing. Short-sleeved shirts, shorts, sunglasses, and a wide-brimmed hat are highly recommended. Wear breathable sandals or sneakers.";
    activities = "Perfect day for water sports, beach visits, swimming, or staying in air-conditioned spaces like museums or libraries during peak heat. Keep outdoor workouts to early morning or late evening.";
    precautions = `High temperatures of ${c.temp.toFixed(1)}°C require active hydration. Apply broad-spectrum sunscreen (SPF 30+) every 2 hours, and minimize direct sun exposure between 10 AM and 4 PM.`;
    summary = `The sun is showing off its golden armor in ${c.cityName}—stay cool!`;
  } else if (c.temp > 15) {
    clothing = "Ideal mild weather! Wear a light jacket, cardigans, or sweaters over a t-shirt. Jeans or chinos paired with light shoes or sneakers are excellent.";
    activities = "Superb weather for outdoor dining, jogging, hiking in the parks, bicycling, or taking a scenic photo walk around town. Enjoy the comfortable temperature!";
    precautions = c.uvIndex > 5 
      ? "Apply moisturizer and standard UV block. Keep sunglasses handy, and carry a light water bottle."
      : "No severe weather concerns. Have a great day outdoors!";
    summary = `An absolutely delightful, comfortable climate in ${c.cityName}—the perfect backdrop for an adventure.`;
  } else if (c.temp > 5) {
    clothing = "It's chilly! Dress in warm layers: a thermal base under a sweater, paired with a windproof coat or heavy jacket. Long trousers, woolen socks, and boots are recommended.";
    activities = "Great for brisk walking, warm indoor cafes, shopping malls, visiting local museums, or nesting at home with a hot beverage and a good movie.";
    precautions = "Keep extremities covered to avoid wind-chill. Carry a travel lotion or lip balm to prevent dry skin in the crisp air.";
    summary = `There's a refreshing, cool crispness whispering through ${c.cityName} today.`;
  } else {
    clothing = "Freezing temperatures! Wear heavy winter clothing: thermal underwear, thick fleece/wool sweaters, insulated parkas or down coats. Essential accessories: beanies, insulated gloves, and a scarf.";
    activities = "Highly favor cozy indoor activities like baking, thermal spas, climbing gyms, or visiting heated libraries. If outdoors, limit exposure to short, brisk walks.";
    precautions = "Be cautious of potential icy paths or black ice. Keep warm and monitor local heating alerts. Ensure pets are kept warm and indoors.";
    summary = `A frosty winter embrace has taken over ${c.cityName}—wrap up warm!`;
  }

  // Adjust for rain/storms
  if (c.mainCondition === "Rain" || c.mainCondition === "Drizzle") {
    clothing = "Wear a waterproof raincoat or hooded trench over standard layers. Bring an umbrella, and choose waterproof leather or rubber boots to keep feet dry.";
    activities = "Best suited for indoor activities. Cozy up in a local bookstore, enjoy a board game café, catch a theater performance, or try indoor bowling.";
    precautions = "Road conditions may be slippery; drive at reduced speeds and watch out for pooling water. Avoid walking directly under heavy gutters.";
    summary = `Gentle raindrops are drumming their rhythmic, peaceful symphony over ${c.cityName}.`;
  } else if (c.mainCondition === "Thunderstorm") {
    clothing = "Stick to full waterproof gear if you must go out. Sturdy boots with non-slip soles are essential. Keep an umbrella closely tucked.";
    activities = "Stay strictly indoors! Perfect for cooking a hearty meal at home, reading, or working on indoor projects away from windows.";
    precautions = "Severe storm conditions. Keep electronics unplugged to avoid power surges, avoid contact with corded phones, and stay clear of windows.";
    summary = `Nature is displaying its high-voltage power in ${c.cityName}—stay safe indoors!`;
  }

  return { clothing, activities, precautions, summary };
}
