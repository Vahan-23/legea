import assert from "node:assert/strict";
import { test } from "node:test";
import { querySearchScore } from "./catalogFilters";
import type { Product } from "@/types/product";

function stub(id: string, nameRu = id): Product {
  return {
    id,
    name: { ru: nameRu, en: nameRu, hy: nameRu },
    category: "calcio",
    type: "maglie",
    model: null,
    gsm: null,
    composition: "",
    sizes: ["M"],
    features: [],
    tech: [],
    colorways: [],
    priceLevel: 1,
    basePrice: null,
    moq: 1,
    brandable: false,
    brandingZones: [],
  };
}

test("314 matches B314 by digit fragment", () => {
  const p = stub("B314", "Сумка Nuoro Big");
  assert.ok(querySearchScore(p, "314", "ru") >= 65);
});

test("b 314 matches B314 after normalize", () => {
  const p = stub("B314", "Сумка Nuoro Big");
  assert.ok(querySearchScore(p, "b 314", "ru") >= 80);
});

test("1173 matches TXM1173P229", () => {
  const p = stub("TXM1173P229", "Костюм Manila Tokyo");
  assert.ok(querySearchScore(p, "1173", "ru") >= 65);
});

test("unrelated query scores 0", () => {
  const p = stub("B314", "Сумка Nuoro Big");
  assert.equal(querySearchScore(p, "zzzz", "ru"), 0);
});
