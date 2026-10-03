import { describe, expect, test } from "vitest";

import {
  formatAction,
  formatExcerpt,
  formatShortSha,
  getDisplayedEvents,
  getEventAppearance,
  getPullRequestAction,
  getPushUrl,
  getReviewVerb,
  mergeEvents,
  stripRefPrefix,
} from "../../src/libs/events";
import type { GitHubEvent } from "../../src/libs/github";

function watchEvent(id: string, createdAt: string): GitHubEvent {
  return { created_at: createdAt, id, payload: { action: "started" }, repo: { name: "octocat/hello" }, type: "WatchEvent" };
}

describe("getDisplayedEvents", () => {
  test("sorts the newest event first and drops unsupported types", () => {
    const unsupported = { ...watchEvent("x", "2026-01-03T00:00:00Z"), type: "SponsorshipEvent" } as unknown as GitHubEvent;

    const events = getDisplayedEvents([
      watchEvent("old", "2026-01-01T00:00:00Z"),
      unsupported,
      watchEvent("new", "2026-01-02T00:00:00Z"),
    ]);

    expect(events.map(({ id }) => id)).toEqual(["new", "old"]);
  });
});

describe("mergeEvents", () => {
  test("replaces events with the same id", () => {
    const merged = mergeEvents(
      [watchEvent("1", "2026-01-01T00:00:00Z")],
      [watchEvent("1", "2026-01-05T00:00:00Z"), watchEvent("2", "2026-01-02T00:00:00Z")],
    );

    expect(merged.map(({ created_at }) => created_at)).toEqual(["2026-01-05T00:00:00Z", "2026-01-02T00:00:00Z"]);
  });
});

describe("getEventAppearance", () => {
  test("distinguishes created refs", () => {
    const create = (ref_type: "branch" | "repository" | "tag"): GitHubEvent => ({
      created_at: "",
      id: "1",
      payload: { ref: null, ref_type },
      repo: { name: "a/b" },
      type: "CreateEvent",
    });

    expect([create("tag"), create("repository"), create("branch")].map((event) => getEventAppearance(event).icon)).toEqual([
      "tag",
      "repo",
      "branch",
    ]);
  });

  test("marks a merged pull request as merged", () => {
    const event: GitHubEvent = {
      created_at: "",
      id: "1",
      payload: { action: "closed", number: 1, pull_request: { merged: true, number: 1 } },
      repo: { name: "a/b" },
      type: "PullRequestEvent",
    };

    expect(getEventAppearance(event)).toEqual({ icon: "merge", tone: "merged" });
  });

  test("shows a star for watch events", () => {
    expect(getEventAppearance(watchEvent("1", ""))).toEqual({ icon: "star", tone: "star" });
  });
});

describe("getPullRequestAction", () => {
  test("reports merged only for closed merged pull requests", () => {
    expect(getPullRequestAction({ action: "closed", number: 1, pull_request: { merged: true, number: 1 } })).toBe("merged");
    expect(getPullRequestAction({ action: "closed", number: 1, pull_request: { merged: false, number: 1 } })).toBe("closed");
    expect(getPullRequestAction({ action: "opened", number: 1, pull_request: { number: 1 } })).toBe("opened");
  });
});

describe("formatters", () => {
  test("formats excerpts, refs, shas, actions and review verbs", () => {
    expect(formatExcerpt("  one\n\n\ntwo  ")).toBe("one\ntwo");
    expect(stripRefPrefix("refs/heads/main")).toBe("main");
    expect(stripRefPrefix("refs/tags/v1.0.0")).toBe("v1.0.0");
    expect(formatShortSha("0123456789abcdef")).toBe("0123456");
    expect(formatAction("review_requested")).toBe("Review requested");
    expect(getReviewVerb("approved")).toBe("Approved");
    expect(getReviewVerb("commented")).toBe("Reviewed");
  });

  test("links a push to its commit or to a comparison", () => {
    expect(getPushUrl("a/b", { before: "0000000", head: "abc" })).toBe("https://github.com/a/b/commit/abc");
    expect(getPushUrl("a/b", { before: "def", head: "abc" })).toBe("https://github.com/a/b/compare/def...abc");
  });
});
