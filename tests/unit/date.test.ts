import { describe, expect, test } from "vitest";

import { groupEventsByDay } from "../../src/libs/date";
import type { GitHubEvent } from "../../src/libs/github";

function eventAt(id: string, date: Date): GitHubEvent {
  return { created_at: date.toISOString(), id, payload: { action: "started" }, repo: { name: "a/b" }, type: "WatchEvent" };
}

describe("groupEventsByDay", () => {
  const now = new Date(2026, 5, 15, 12);

  test("groups events by local day and keeps their order", () => {
    const groups = groupEventsByDay(
      [
        eventAt("1", new Date(2026, 5, 15, 9)),
        eventAt("2", new Date(2026, 5, 15, 8)),
        eventAt("3", new Date(2026, 5, 14, 20)),
      ],
      now,
    );

    expect(groups.map(({ events }) => events.map(({ id }) => id))).toEqual([["1", "2"], ["3"]]);
  });

  test("labels recent days relatively and older days with the full date", () => {
    const groups = groupEventsByDay(
      [
        eventAt("1", new Date(2026, 5, 15, 9)),
        eventAt("2", new Date(2026, 5, 14, 9)),
        eventAt("3", new Date(2026, 5, 1, 9)),
      ],
      now,
    );

    expect(groups.map(({ label }) => label).slice(0, 2)).toEqual(["Today", "Yesterday"]);
    expect(groups[2]?.label).toContain("2026");
  });
});
