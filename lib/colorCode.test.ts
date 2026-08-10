import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  darkenHex,
  parseColorCode,
  parseColorway,
  swatchBackground,
} from "./colorCode";

describe("parseColorCode", () => {
  it("00YY — однотонный: цвет = YY", () => {
    const parsed = parseColorCode("0002");
    assert.equal(parsed.isSolid, true);
    assert.equal(parsed.baseKey, "02");
    assert.equal(parsed.trimKey, "02");
    assert.equal(parsed.base, "#1E5FD0");
    assert.equal(parsed.trim, darkenHex("#1E5FD0", 0.12));
    assert.equal(parsed.isIridescent, false);
  });

  it("XXYY — двухцветный", () => {
    const parsed = parseColorCode("0203");
    assert.equal(parsed.isSolid, false);
    assert.equal(parsed.baseKey, "02");
    assert.equal(parsed.trimKey, "03");
    assert.equal(parsed.base, "#1E5FD0");
    assert.equal(parsed.trim, "#FFFFFF");
  });

  it("XX===YY — однотонный с затемнённым trim", () => {
    const parsed = parseColorCode("1010");
    assert.equal(parsed.isSolid, true);
    assert.equal(parsed.baseKey, "10");
    assert.equal(parsed.trim, darkenHex("#111111", 0.12));
  });

  it("LUXIOM-коды — isIridescent", () => {
    for (const code of ["1075", "2324", "0476"] as const) {
      assert.equal(parseColorCode(code).isIridescent, true);
    }
    assert.equal(parseColorCode("0476").baseKey, "04");
    assert.equal(parseColorCode("0476").trimKey, "76");
    assert.equal(parseColorCode("1075").trimKey, "75");
  });

  it("0910 использует код 09 (grey)", () => {
    const parsed = parseColorCode("0910");
    assert.equal(parsed.baseKey, "09");
    assert.equal(parsed.trimKey, "10");
    assert.equal(parsed.isSolid, false);
  });
});

describe("parseColorway", () => {
  it("kit AABB-CCDD", () => {
    const parsed = parseColorway("2324-0004");
    assert.equal(parsed.kind, "kit");
    if (parsed.kind !== "kit") return;
    assert.equal(parsed.top.isIridescent, true);
    assert.equal(parsed.bottom.isSolid, true);
    assert.equal(parsed.bottom.baseKey, "04");
  });
});

describe("swatchBackground", () => {
  it("solid — плоский hex", () => {
    assert.equal(swatchBackground("0003"), "#FFFFFF");
  });

  it("двухцветный — conic-gradient", () => {
    const bg = swatchBackground("1204");
    assert.match(bg, /^conic-gradient/);
    assert.match(bg, /#D8232A/);
    assert.match(bg, /#14204A/);
  });
});
