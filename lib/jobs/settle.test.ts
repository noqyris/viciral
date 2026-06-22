import { describe, expect, it } from "vitest";
import { reconcileCharge } from "./settle";

describe("reconcileCharge", () => {
  it("charges the actual and refunds the unused reservation", () => {
    expect(reconcileCharge(100, 0, 60)).toEqual({ charged: 60, refund: 40 });
  });

  it("refunds the whole reservation on a failed job (actual 0)", () => {
    expect(reconcileCharge(100, 0, 0)).toEqual({ charged: 0, refund: 100 });
  });

  it("includes pre-spent credits and never charges above the reservation", () => {
    // pre-spent 20 + actual 90 = 110, capped at the 100 reserved
    expect(reconcileCharge(100, 20, 90)).toEqual({ charged: 100, refund: 0 });
  });

  it("treats negative actual as zero", () => {
    expect(reconcileCharge(100, 0, -5)).toEqual({ charged: 0, refund: 100 });
  });
});
