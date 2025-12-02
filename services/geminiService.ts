import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BookletData, WeatherType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    destination: {
      type: Type.STRING,
      description: "The main location or city of the trip found in cell C1 (Row 1, Column 3).",
    },
    totalSpend: {
      type: Type.NUMBER,
      description: "The total sum of expenses found in column I.",
    },
    spendBreakdown: {
      type: Type.ARRAY,
      description: "A breakdown of expenses categorized by type (e.g., Flights, Hotel, Food) derived from column I.",
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          amount: { type: Type.NUMBER },
        },
        required: ["category", "amount"],
      },
    },
    days: {
      type: Type.ARRAY,
      description: "The daily itinerary extracted from the sheet rows.",
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "The date of this itinerary day (e.g., 'Oct 12' or 'Monday') extracted from column A." },
          weather: {
            type: Type.STRING,
            enum: ["Sunny", "Rainy", "Cloudy", "Snowy"],
            description: "A predicted or random weather condition suitable for the location and season.",
          },
          highlights: {
            type: Type.ARRAY,
            description: "A list of 3-4 distinct, engaging highlights. Includes reviews for venues.",
            items: { type: Type.STRING }
          },
          events: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING, description: "Time of the event found in Column D." },
                description: { type: Type.STRING, description: "The main activity name found in Column E." },
                location: { type: Type.STRING, description: "Specific venue or place name if mentioned in Column E." },
              },
              required: ["description"],
            },
          },
        },
        required: ["date", "weather", "highlights", "events"],
      },
    },
  },
  required: ["destination", "totalSpend", "spendBreakdown", "days"],
};

export const parseItinerary = async (rawData: string): Promise<BookletData> => {
  try {
    const prompt = `
      You are an expert travel assistant. I will provide raw text from a spreadsheet itinerary (CSV format).
      
      Your task is to parse this data into a structured JSON slide deck.
      
      SPECIFIC INSTRUCTIONS FOR THE SHEET STRUCTURE:
      1. **Location & Title**: 
         - The trip title/location is in **merged cell C1** (Row 1, Column 3).
         - Example: "Thailand Trip" in the header row.
      
      2. **Spend Data (Columns I, J, K, L)**:
         - **Column I** (9th col): Cost Person 1.
         - **Column J** (10th col): Cost Category Code. Map these codes to full names:
            - A = Airfare
            - H = Housing
            - F = Food
            - S = Shopping
            - G = Gifts
            - T = Transportation
            - R = Recreation
         - **Column K** (11th col): Cost Person 2.
         - **Column L** (12th col): Total Cost (Sum of I and K).
         - **Logic**: 
            - Calculate 'totalSpend' as the sum of **Column L** for all rows.
            - Generate 'spendBreakdown' by summing **Column L** grouped by the category derived from **Column J**.
      
      3. **Itinerary Columns (A, D, E) & Row Grouping**:
         - **Column A (Date)**: This indicates the start of a new day. 
         - **IMPORTANT**: The spreadsheet uses "sparse dates". This means a date only appears in the first row of that day. 
         - **Logic**: If Column A contains a date (e.g., "11/1/2025"), it starts a new Day object. If Column A is empty, the row belongs to the current (most recently defined) day.
         - **Include ALL rows** between two dates as events for that day.
         - **Ignore Empty Rows**: If a row has no data in Columns A, D, or E, ignore it entirely. Do not create empty events.
         - **Column D**: TIME. Extract the start time from Column D.
         - **Column E**: LOCATION/ACTIVITY. Use Column E for the event description.
      
      4. **Enrichment & Highlights (CRITICAL)**:
         - **Highlights**: Generate a list of 3-4 distinct highlights for each day.
         - **Formatting**: Ensure highlights are complete sentences and properly capitalized.
         - **Reviews**: 
            - For **Restaurants/Food** events: Include one highlight that reads like a **Google Review** (e.g., "Review: 'Best Pad Thai in the city, the service was quick and the ambiance electric'").
            - For **Hotels/Resorts**: Include one highlight that reads like a **Forbes Travel Guide or Michelin Guide** snippet (e.g., "Forbes says: 'This 5-star sanctuary offers unparalleled luxury with breathtaking river views.'").
         - **Weather**: Predict realistic weather for the location and date.
      
      RAW DATA:
      ${rawData}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text) as BookletData;
  } catch (error) {
    console.error("Error parsing itinerary:", error);
    throw new Error("Failed to parse itinerary. Please check your input and try again.");
  }
};