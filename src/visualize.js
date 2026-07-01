/**
 * Visualize the compiled LangGraph.
 *
 *   npm run viz          # prints Mermaid text + saves graph.mmd
 *   npm run viz -- png   # also saves graph.png (uses the mermaid.ink web API)
 *
 * Paste the Mermaid text into https://mermaid.live to view it, or open the
 * generated graph.mmd in a Mermaid-aware editor / Markdown preview.
 */
import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { app } from "./graph.js";

const graph = await app.getGraphAsync();

// 1. Mermaid source — fully local, no network needed.
const mermaid = graph.drawMermaid();
console.log("\n--- Mermaid ---\n");
console.log(mermaid);
await writeFile("graph.mmd", mermaid);
console.log("Saved graph.mmd");

// 2. Optional PNG — calls the mermaid.ink web service, so needs internet.
if (process.argv.includes("png")) {
  const blob = await graph.drawMermaidPng();
  const buffer = Buffer.from(await blob.arrayBuffer());
  await writeFile("graph.png", buffer);
  console.log("Saved graph.png");
}
