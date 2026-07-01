/**
 * Shopify assistant bot — entry point.
 *
 * Run an interactive chat:
 *     npm start
 */
import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { HumanMessage } from "@langchain/core/messages";
import { app } from "./graph.js";

const SYSTEM_PROMPT =
  "You are a helpful Shopify shopping assistant. Help customers find products " +
  "and place orders. Use the available tools to look up real data — never make " +
  "up product details, prices, or availability.";

async function main() {
  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY is not set. Copy .env.example to .env and add your key.");
    process.exit(1);
  }

  const rl = readline.createInterface({ input, output });
  console.log("Shopify bot ready. Type 'quit' to exit.");

  // Seed history with the system prompt so the bot stays on-task.
  let history = [{ role: "system", content: SYSTEM_PROMPT }];

  while (true) {
    const userInput = (await rl.question("\nYou: ")).trim();
    if (["quit", "exit", "q"].includes(userInput.toLowerCase())) break;
    if (!userInput) continue;

    history.push(new HumanMessage(userInput));
    const result = await app.invoke({ messages: history });
    history = result.messages;
    console.log(`\nBot: ${history[history.length - 1].content}`);
  }

  rl.close();
}

main();
