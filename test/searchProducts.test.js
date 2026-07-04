import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { variantHasDiscount, shapeProduct } from "../src/tools/searchProducts.js";

describe("variantHasDiscount", () => {
  test("true when compare_at_price is higher than price", () => {
    assert.equal(variantHasDiscount({ price: "15.00", compare_at_price: "25.00" }), true);
  });

  test("false when compare_at_price equals price", () => {
    assert.equal(variantHasDiscount({ price: "15.00", compare_at_price: "15.00" }), false);
  });

  test("false when compare_at_price is lower than price", () => {
    assert.equal(variantHasDiscount({ price: "15.00", compare_at_price: "10.00" }), false);
  });

  test('false for "0.00" compare_at_price (the real API default)', () => {
    assert.equal(variantHasDiscount({ price: "15.00", compare_at_price: "0.00" }), false);
  });

  test("false when compare_at_price is null", () => {
    assert.equal(variantHasDiscount({ price: "2.99", compare_at_price: null }), false);
  });
});

describe("shapeProduct", () => {
  // Real payload shape from the Phoenix API (a draft product, no discount).
  const draftProduct = {
    id: 10402816524607,
    title: "vip_initial_sp1",
    vendor: "Shapewear Offer",
    product_type: "VIP Initial",
    status: "draft",
    variants: [
      {
        title: "Default Title",
        price: "15.00",
        compare_at_price: "0.00",
        inventory_management: null,
        inventory_quantity: 0,
      },
    ],
  };

  test("maps the top-level fields (incl. snake_case -> camelCase)", () => {
    const shaped = shapeProduct(draftProduct);
    assert.equal(shaped.id, 10402816524607);
    assert.equal(shaped.title, "vip_initial_sp1");
    assert.equal(shaped.vendor, "Shapewear Offer");
    assert.equal(shaped.productType, "VIP Initial");
    assert.equal(shaped.status, "draft");
  });

  test("maps variants and flags no discount", () => {
    const shaped = shapeProduct(draftProduct);
    assert.equal(shaped.hasDiscount, false);
    assert.equal(shaped.variants.length, 1);
    assert.deepEqual(shaped.variants[0], {
      title: "Default Title",
      price: "15.00",
      compareAtPrice: "0.00",
      hasDiscount: false,
      available: true, // inventory_management null => untracked => available
    });
  });

  test("untracked inventory (null) is available even when quantity is 0", () => {
    const shaped = shapeProduct(draftProduct);
    assert.equal(shaped.variants[0].available, true);
  });

  test("tracked inventory is available only when quantity > 0", () => {
    const inStock = shapeProduct({
      variants: [{ price: "2.99", compare_at_price: null, inventory_management: "shopify", inventory_quantity: 25 }],
    });
    const outOfStock = shapeProduct({
      variants: [{ price: "2.99", compare_at_price: null, inventory_management: "shopify", inventory_quantity: 0 }],
    });
    assert.equal(inStock.variants[0].available, true);
    assert.equal(outOfStock.variants[0].available, false);
  });

  test("product hasDiscount is true when any variant is discounted", () => {
    const shaped = shapeProduct({
      variants: [
        { price: "15.00", compare_at_price: "0.00" },
        { price: "15.00", compare_at_price: "25.00" },
      ],
    });
    assert.equal(shaped.hasDiscount, true);
  });

  test("handles a product with no variants", () => {
    const shaped = shapeProduct({ id: 1, title: "Empty", variants: [] });
    assert.deepEqual(shaped.variants, []);
    assert.equal(shaped.hasDiscount, false);
  });
});
