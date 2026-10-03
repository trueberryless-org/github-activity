import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { getCachedActivity, setCachedActivity } from "../../src/libs/cache";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("activity cache", () => {
  test("returns activity that was stored less than an hour ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    setCachedActivity("octocat", { events: [], nextPage: 2 });

    vi.setSystemTime(new Date("2026-01-01T00:59:00Z"));

    expect(getCachedActivity("octocat")).toMatchObject({ events: [], nextPage: 2 });
  });

  test("drops activity that is older than an hour", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    setCachedActivity("octocat", { events: [], nextPage: null });

    vi.setSystemTime(new Date("2026-01-01T01:00:01Z"));

    expect(getCachedActivity("octocat")).toBeNull();
  });

  test("ignores a missing or corrupt entry", () => {
    expect(getCachedActivity("nobody")).toBeNull();

    store.set("github_events_broken", "{");

    expect(getCachedActivity("broken")).toBeNull();
  });
});
