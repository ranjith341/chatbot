import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { log } from "../logger.js";

/**
 * Test tool with hard-coded data so the bot works without any external API.
 * Swap the body for a real weather API call when ready.
 */
export const getWeather = tool(
  async ({ city }) => {
    const fakeData = {
      london: "15°C and cloudy",
      tokyo: "22°C and sunny",
      "new york": "18°C and rainy",
    };
    const result = fakeData[city.toLowerCase()] ?? `Sorry, I have no weather data for ${city}.`;
    log.tool("get_weather", { city }, result);
    return result;
  },
  {
    name: "get_weather",
    description: "Get the current weather for a given city.",
    schema: z.object({
      city: z.string().describe("The city to get the weather for"),
    }),
  }
);
