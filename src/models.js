import { ChatGroq } from "@langchain/groq";
import { tools } from "./tools/index.js";

/**
 * Builds the chat model with all tools bound.
 *
 * Uses Groq. Override the model via GROQ_MODEL; the default supports tool calling.
 */
export const model = new ChatGroq({
  model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  temperature: 0,
}).bindTools(tools);
