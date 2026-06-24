import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALES, isLocale, pick } from "./i18n";

describe("DEFAULT_LOCALE", () => {
  it("is English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("is one of the known locales", () => {
    expect(LOCALES).toContain(DEFAULT_LOCALE);
  });
});

describe("isLocale", () => {
  it("is true for the supported locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("sr")).toBe(true);
  });

  it("is false for anything else", () => {
    expect(isLocale("de")).toBe(false);
    expect(isLocale("EN")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});

describe("pick", () => {
  const dict = { sr: "zdravo", en: "hello" };

  it("returns the right side for each locale", () => {
    expect(pick("en", dict)).toBe("hello");
    expect(pick("sr", dict)).toBe("zdravo");
  });

  it("works with non-string values", () => {
    expect(pick("en", { sr: 1, en: 2 })).toBe(2);
    expect(pick("sr", { sr: 1, en: 2 })).toBe(1);
  });
});
