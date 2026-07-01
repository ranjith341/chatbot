import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { log } from "../logger.js";

const API_BASE =
  process.env.PHOENIX_API_BASE ??
  "https://staging-api.phoenixcrm.io/portal/api";
const STORE_ID = process.env.PHOENIX_STORE_ID ?? "185";
// How many products to pull from the API per call. We fetch a page, then apply
// the discount filter and the caller's `limit` client-side.
const FETCH_LIMIT = 200;

/**
 * A variant is discounted when it has a compare-at price that is strictly
 * higher than its selling price. The Phoenix API returns these as string
 * amounts (e.g. "15.00"), so compare numerically.
 */
function variantHasDiscount(v) {
  return (
    v.compare_at_price != null && Number(v.compare_at_price) > Number(v.price)
  );
}

/** Map the raw Shopify-style product into a compact shape for the LLM. */
function shapeProduct(p) {
  // forEach (not map) so each variant can be inspected/logged while debugging.
  const variants = [];
  (p.variants ?? []).forEach((v) => {
    const shapedVariant = {
      title: v.title,
      price: v.price,
      compareAtPrice: v.compare_at_price,
      hasDiscount: variantHasDiscount(v),
      // inventory_management null means stock isn't tracked -> treat as available
      available: v.inventory_management == null || (v.inventory_quantity ?? 0) > 0,
    };
    console.log("  [shape] variant:", shapedVariant);
    variants.push(shapedVariant);
  });

  const shaped = {
    id: p.id,
    title: p.title,
    vendor: p.vendor,
    productType: p.product_type,
    status: p.status,
    hasDiscount: variants.some((v) => v.hasDiscount),
    variants,
  };
  console.log("  [shape] product:", shaped.title, JSON.stringify(shaped));
  return shaped;
}

/**
 * Search the Phoenix CRM store catalog for products by title.
 *
 * When the customer asks specifically for *discounted* products, the LLM should
 * set discountOnly=true and we filter to products where a variant's
 * compare-at price exceeds its selling price.
 */
export const searchProducts = tool(
  async ({ query, discountOnly, limit }) => {
    const token = process.env.PHOENIX_API_TOKEN;
    if (!token) {
      return "Product search is not configured (PHOENIX_API_TOKEN is missing).";
    }

    const title = (query ?? "").trim();
    // When filtering by discount we must fetch a full page and filter locally;
    // otherwise we can ask the API for just `limit` products to keep it cheap.
    const apiLimit = discountOnly ? FETCH_LIMIT : (limit ?? FETCH_LIMIT);
    const url =
      `${API_BASE}/e_commerce_products/store/${STORE_ID}` +
      `?Limit=${apiLimit}&Page=0&BillingTypeId=&Collections=&Title=${encodeURIComponent(title)}`;

    let products;
    try {
      const res = await fetch(url, {
        headers: {
          accept: "*/*",
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
      });
      console.log("response", res);
      if (!res.ok) {
        const msg = `Product API returned ${res.status} ${res.statusText}.`;
        log.tool("search_products", { query, discountOnly, limit }, msg);
        return msg;
      }
      products = await res.json();
      console.log(products.length, "products");
    } catch (err) {
      const msg = `Failed to reach the product API: ${err.message}`;
      log.tool("search_products", { query, discountOnly, limit }, msg);
      return msg;
    }

    // The API wraps the products in { Limit, Page, TotalCount, Result: [...] }.
    // Unwrap Result; fall back to a bare array in case the shape changes.
    const list = Array.isArray(products?.Result)
      ? products.Result
      : Array.isArray(products)
        ? products
        : [];
    console.log(`[raw] ${list.length} products (TotalCount: ${products?.TotalCount ?? "?"})`);

    // forEach (not map) so each product is shaped/logged one at a time.
    let shaped = [];
    list.forEach((p, i) => {
      console.log(`[shape] #${i} ${p.title}`);
      shaped.push(shapeProduct(p));
    });

    if (discountOnly) shaped = shaped.filter((p) => p.hasDiscount);
    if (limit && limit > 0) shaped = shaped.slice(0, limit);

    const what = `${discountOnly ? "discounted " : ""}products${title ? ` for "${title}"` : ""}`;
    const result = shaped.length ? shaped : `No ${what} found.`;
    log.tool(
      "search_products",
      { query, discountOnly, limit },
      `${shaped.length} product(s)`,
    );
    return JSON.stringify(result);
  },
  {
    name: "search_products",
    description:
      "Search the store catalog for products. Returns products with title, " +
      "vendor, status, per-variant price, compare-at price, discount flag, and " +
      "availability. Leave query empty to browse all products. Set discountOnly " +
      "to true when the customer asks for discounted / on-sale products. Set " +
      "limit to cap how many products to return (e.g. 'show me two products' -> limit 2).",
    schema: z.object({
      query: z
        .string()
        .nullable()
        .optional()
        .default("")
        .describe(
          "Product name or keyword. Leave empty to browse all products.",
        ),
      discountOnly: z
        .boolean()
        .nullable()
        .optional()
        .default(false)
        .describe("Return only products that are currently discounted"),
      limit: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional()
        .describe(
          "Maximum number of products to return (e.g. 2 for 'any two products')",
        ),
    }),
  },
);
