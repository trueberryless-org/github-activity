import type { GitHubEvent } from "./github";

const CACHE_KEY_PREFIX = "github_events_";
const CACHE_EXPIRATION_MS = 60 * 60 * 1000;

export function getCachedActivity(username: string): CachedActivity | null {
  try {
    const value = localStorage.getItem(getCacheKey(username));
    if (!value) return null;

    const activity: CachedActivity = JSON.parse(value);

    return isCachedActivityFresh(activity, Date.now()) ? activity : null;
  } catch {
    return null;
  }
}

export function setCachedActivity(
  username: string,
  activity: Omit<CachedActivity, "timestamp">
) {
  try {
    localStorage.setItem(
      getCacheKey(username),
      JSON.stringify({ ...activity, timestamp: Date.now() })
    );
  } catch (error) {
    console.warn("[gh-activity] Failed to cache activity.", error);
  }
}

function isCachedActivityFresh(activity: CachedActivity, now: number) {
  return (
    Array.isArray(activity.events) &&
    typeof activity.timestamp === "number" &&
    now - activity.timestamp < CACHE_EXPIRATION_MS
  );
}

function getCacheKey(username: string) {
  return `${CACHE_KEY_PREFIX}${username}`;
}

export interface CachedActivity {
  events: GitHubEvent[];
  nextPage: number | null;
  timestamp: number;
}
