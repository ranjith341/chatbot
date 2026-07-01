/**
 * Tool registry.
 *
 * To add a new tool: create a file in this folder (copy searchProducts.js as a
 * template), then import and add it to the `tools` array below. The graph and
 * models pick it up automatically.
 */
import { getWeather } from "./getWeather.js";
import { searchProducts } from "./searchProducts.js";

export const tools = [getWeather, searchProducts];
