import { afterEach, describe, expect, test, vi } from "vitest";

import {
  GitHubApiError,
  fetchUserEvents,
  getAvatarUrl,
  getProfileUrl,
  getRepoOwner,
  getRepoUrl,
  isAbortError,
  searchUsers,
} from "../../src/libs/github";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

describe("url helpers", () => {
  test("builds profile, avatar and repository urls", () => {
    expect(getProfileUrl("octocat")).toBe("https://github.com/octocat");
    expect(getAvatarUrl("octocat", 28)).toBe("https://github.com/octocat.png?size=56");
    expect(getRepoUrl("octocat/hello", "tree", "main")).toBe("https://github.com/octocat/hello/tree/main");
    expect(getRepoOwner("octocat/hello")).toBe("octocat");
  });
});

describe("fetchUserEvents", () => {
  test("requests the public events and detects a next page", async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify([{ id: "1" }]), {
        headers: { link: '<https://api.github.com/x?page=2>; rel="next"' },
      }),
    );

    const result = await fetchUserEvents("octo cat", 1, new AbortController().signal);

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://api.github.com/users/octo%20cat/events/public?per_page=30&page=1",
    );
    expect(result).toEqual({ events: [{ id: "1" }], nextPage: 2 });
  });

  test("has no next page without a link header", async () => {
    stubFetch(new Response("[]"));

    expect((await fetchUserEvents("octocat", 3, new AbortController().signal)).nextPage).toBeNull();
  });

  test("maps a 404 to a not-found error", async () => {
    stubFetch(new Response("{}", { status: 404 }));

    await expect(fetchUserEvents("nobody", 1, new AbortController().signal)).rejects.toMatchObject({
      kind: "not-found",
    });
  });

  test("maps an exhausted rate limit to a rate-limited error with its reset time", async () => {
    stubFetch(
      new Response("{}", {
        headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1700000000" },
        status: 403,
      }),
    );

    const error = await fetchUserEvents("octocat", 1, new AbortController().signal).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(GitHubApiError);
    expect(error).toMatchObject({ kind: "rate-limited", resetAt: new Date(1_700_000_000_000) });
  });

  test("maps other failures to an unknown error", async () => {
    stubFetch(new Response("{}", { status: 500 }));

    await expect(fetchUserEvents("octocat", 1, new AbortController().signal)).rejects.toMatchObject({
      kind: "unknown",
    });
  });
});

describe("searchUsers", () => {
  test("returns the matching users", async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ items: [{ avatar_url: "", login: "octocat" }] })));

    const users = await searchUsers("octo", new AbortController().signal);

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://api.github.com/search/users?q=octo&per_page=5");
    expect(users).toEqual([{ avatar_url: "", login: "octocat" }]);
  });
});

describe("isAbortError", () => {
  test("only matches abort errors", () => {
    expect(isAbortError(new DOMException("aborted", "AbortError"))).toBe(true);
    expect(isAbortError(new Error("aborted"))).toBe(false);
  });
});
