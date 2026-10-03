import { describe, expect, test } from "vitest";

import {
  DEFAULT_USERNAME,
  getUrlWithUsername,
  getUsernameFromUrl,
  normalizeUsername,
} from "../../src/libs/username";

describe("normalizeUsername", () => {
  test.each([
    ["  Octo Cat  ", "octo-cat"],
    ["octo--cat", "octo-cat"],
    ["-octocat-", "octocat"],
    ["octo_cat!", "octocat"],
    ["", ""],
  ])("normalizes %j to %j", (input, expected) => {
    expect(normalizeUsername(input)).toBe(expected);
  });
});

describe("getUsernameFromUrl", () => {
  test("reads the user search parameter", () => {
    expect(getUsernameFromUrl(new URL("https://example.com/?user=Octocat"))).toBe("octocat");
  });

  test.each(["https://example.com/", "https://example.com/?user=", "https://example.com/?user=!!!"])(
    "falls back to the default user for %s",
    (url) => {
      expect(getUsernameFromUrl(new URL(url))).toBe(DEFAULT_USERNAME);
    },
  );
});

describe("getUrlWithUsername", () => {
  test("sets the user search parameter without mutating the input", () => {
    const url = new URL("https://example.com/?foo=bar");

    expect(getUrlWithUsername(url, "octocat").href).toBe("https://example.com/?foo=bar&user=octocat");
    expect(url.href).toBe("https://example.com/?foo=bar");
  });
});
