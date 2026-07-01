/** Tiny tracer so you can watch the LLM ↔ tool flow. Set DEBUG=false to silence. */
const enabled = process.env.DEBUG !== "false";

export const log = {
  llmToolCall(name, args) {
    if (enabled) console.log(`  [llm] wants to call ${name}(${JSON.stringify(args)})`);
  },
  llmDirect() {
    if (enabled) console.log(`  [llm] answered directly (no tool call)`);
  },
  tool(name, args, result) {
    if (enabled) console.log(`  [tool] ${name}(${JSON.stringify(args)}) -> ${JSON.stringify(result)}`);
  },
};
