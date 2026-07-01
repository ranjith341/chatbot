# Shopify Assistant Bot (LangGraph + Node.js)

A LangGraph.js chatbot that helps customers find products and place Shopify
orders. Uses OpenAI (with Groq as an automatic fallback) and a set of tools.

## Setup

```bash
npm install
cp .env.example .env   # then add your keys
```

## Run

```bash
npm start
```

Then chat. Try: `Do you have any shoes?` — the model calls the `search_products`
tool and answers from the result.

## Project structure

```
src/
├── index.js              # entry point + interactive chat loop
├── graph.js              # the LangGraph (model ↔ tools ReAct loop)
├── models.js             # OpenAI primary + Groq fallback, tools bound
├── logger.js             # debug tracer (set DEBUG=false to silence)
└── tools/
    ├── index.js          # tool registry — register new tools here
    ├── getWeather.js     # test tool (hard-coded data)
    └── searchProducts.js # Shopify product search (stub — template for real tools)
```

## Adding a new tool

1. Copy `src/tools/searchProducts.js` to a new file (e.g. `createOrder.js`).
2. Update the `name`, `description`, `schema`, and the async body.
3. Import it in `src/tools/index.js` and add it to the `tools` array.

That's it — `models.js` and `graph.js` pick it up automatically.

## How it works

The graph has a `model` node and a `tools` node. The model decides whether to
call a tool; if it does, the graph runs the tool, feeds the result back, and
loops until the model gives a final answer. With `DEBUG` on (default), each LLM
decision and tool execution is printed so you can trace the flow.

## Notes

- The current tools (`get_weather`, `search_products`) return **stub data** so
  the bot runs without external credentials. Replace their bodies with real API
  calls — `searchProducts.js` has a TODO pointing at the Shopify Storefront API.
- Set `GROQ_API_KEY` in `.env` to enable the Groq fallback.
