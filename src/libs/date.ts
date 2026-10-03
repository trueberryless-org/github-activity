import type { GitHubEvent } from "./github";

const DAY_FORMAT = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "long",
  weekday: "long",
  year: "numeric",
});
const TIME_FORMAT = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });
const DATE_TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: "full",
  timeStyle: "short",
});
const RELATIVE_DAY_FORMAT = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

export function groupEventsByDay(events: GitHubEvent[], now: Date) {
  const groups = new Map<string, EventDayGroup>();

  for (const event of events) {
    const date = new Date(event.created_at);
    const key = getLocalDayKey(date);
    const group = groups.get(key);

    if (group) {
      group.events.push(event);
      continue;
    }

    groups.set(key, {
      events: [event],
      key,
      label: formatDayLabel(date, now),
    });
  }

  return [...groups.values()];
}

export function formatTime(date: Date) {
  return TIME_FORMAT.format(date);
}

export function formatDateTime(date: Date) {
  return DATE_TIME_FORMAT.format(date);
}

function formatDayLabel(date: Date, now: Date) {
  const dayDifference = getDayDifference(date, now);

  if (dayDifference > -2) {
    const label = RELATIVE_DAY_FORMAT.format(dayDifference, "day");

    return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
  }

  return DAY_FORMAT.format(date);
}

function getDayDifference(date: Date, now: Date) {
  const dayInMs = 24 * 60 * 60 * 1000;

  return Math.round((getLocalMidnight(date) - getLocalMidnight(now)) / dayInMs);
}

function getLocalMidnight(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
}

function getLocalDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export interface EventDayGroup {
  events: GitHubEvent[];
  key: string;
  label: string;
}
