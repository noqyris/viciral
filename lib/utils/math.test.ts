import { describe, expect, it } from "vitest";
import { clampInt } from "./math";

describe("clampInt", () => {
  it("passes through an in-range integer unchanged", () => {
    expect(clampInt(5, 0, 10, -1)).toBe(5);
  });

  it("clamps to min when below range", () => {
    expect(clampInt(-3, 0, 10, -1)).toBe(0);
  });

  it("clamps to max when above range", () => {
    expect(clampInt(42, 0, 10, -1)).toBe(10);
  });

  it("rounds floats to the nearest integer", () => {
    expect(clampInt(4.4, 0, 10, -1)).toBe(4);
    expect(clampInt(4.6, 0, 10, -1)).toBe(5);
  });

  it("coerces numeric strings", () => {
    expect(clampInt("7", 0, 10, -1)).toBe(7);
    expect(clampInt("7.8", 0, 10, -1)).toBe(8);
    expect(clampInt("100", 0, 10, -1)).toBe(10);
  });

  it("falls back to the provided default for undefined", () => {
    expect(clampInt(undefined, 0, 10, -1)).toBe(-1);
  });

  it("falls back to the provided default for NaN", () => {
    expect(clampInt(NaN, 0, 10, -1)).toBe(-1);
    expect(clampInt("not a number", 0, 10, -1)).toBe(-1);
  });

  it("falls back to the provided default for Infinity", () => {
    expect(clampInt(Infinity, 0, 10, -1)).toBe(-1);
    expect(clampInt(-Infinity, 0, 10, -1)).toBe(-1);
  });

  it("treats null as 0 (Number(null) === 0) and clamps rather than using the fallback", () => {
    expect(clampInt(null, 0, 10, -1)).toBe(0);
    expect(clampInt(null, 3, 10, -1)).toBe(3);
  });
});
