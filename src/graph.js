import { StateGraph, MessagesAnnotation, END, START } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { model } from "./models.js";
import { tools } from "./tools/index.js";
import { log } from "./logger.js";

/**
 * Minimal ReAct loop: the model decides whether to call a tool, the tool runs,
 * the result is fed back, and it loops until the model gives a final answer.
 */
async function callModel(state) {
  const response = await model.invoke(state.messages);
  if (response.tool_calls?.length) {
    for (const tc of response.tool_calls) log.llmToolCall(tc.name, tc.args);
  } else {
    log.llmDirect();
  }
  return { messages: [response] };
}

function shouldContinue(state) {
  const last = state.messages[state.messages.length - 1];
  return last.tool_calls?.length ? "tools" : END;
}

export const app = new StateGraph(MessagesAnnotation)
  .addNode("model", callModel)
  .addNode("tools", new ToolNode(tools))
  .addEdge(START, "model")
  .addConditionalEdges("model", shouldContinue, ["tools", END])
  .addEdge("tools", "model")
  .compile();
