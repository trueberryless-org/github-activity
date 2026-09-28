import { useMemo } from "react";

import { useUserActivity } from "../hooks/use-user-activity";
import { formatTime, groupEventsByDay } from "../libs/date";
import { getDisplayedEvents } from "../libs/events";
import type { GitHubApiError } from "../libs/github";
import { getAvatarUrl, getProfileUrl } from "../libs/github";
import { EventItem } from "./EventItem";
import { Icon } from "./Icon";

export function ActivityFeed({ username }: ActivityFeedProps) {
  const { error, events, loadMore, nextPage, retry, status } =
    useUserActivity(username);
  const dayGroups = useMemo(
    () => groupEventsByDay(getDisplayedEvents(events), new Date()),
    [events]
  );

  const isLoading = status === "loading";
  const isLoadingMore = status === "loading-more";

  return (
    <section
      aria-busy={isLoading || isLoadingMore}
      aria-labelledby="feed-title"
    >
      <header className="flex items-center gap-4">
        <img
          alt=""
          className="size-14 shrink-0 rounded-full border border-zinc-800 bg-zinc-900"
          height="56"
          src={getAvatarUrl(username, 56)}
          width="56"
        />
        <div className="min-w-0">
          <h2
            className="truncate text-xl font-semibold text-white sm:text-2xl"
            id="feed-title"
          >
            <a
              className="rounded hover:underline"
              href={getProfileUrl(username)}
            >
              {username}
            </a>
          </h2>
          <p className="text-sm text-zinc-400">
            Public activity from the last 90 days
          </p>
        </div>
      </header>

      <div className="mt-8">
        {isLoading ? (
          <FeedSkeleton />
        ) : dayGroups.length > 0 ? (
          <div className="space-y-8">
            {dayGroups.map((group) => (
              <section aria-labelledby={`day-${group.key}`} key={group.key}>
                <h3
                  className="mb-3 text-sm font-semibold text-zinc-400"
                  id={`day-${group.key}`}
                >
                  {group.label}
                </h3>
                <ol className="relative space-y-3 before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-zinc-800">
                  {group.events.map((event) => (
                    <EventItem event={event} key={event.id} />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        ) : status !== "error" ? (
          <p className="rounded-xl border border-dashed border-zinc-800 px-6 py-10 text-center text-zinc-400">
            No recent public activity found for {username}.
          </p>
        ) : null}

        {error && <FeedError error={error} onRetry={retry} />}

        {status !== "error" && !isLoading && nextPage !== null && (
          <button
            className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 font-medium text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-70"
            disabled={isLoadingMore}
            onClick={loadMore}
            type="button"
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </section>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-3" role="status">
      <span className="sr-only">Loading activity…</span>
      {[0, 1, 2].map((index) => (
        <div aria-hidden="true" className="flex gap-4" key={index}>
          <div className="mt-2 size-8 shrink-0 rounded-full bg-zinc-900" />
          <div className="h-24 flex-1 rounded-xl border border-zinc-800 bg-zinc-900 motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function FeedError({ error, onRetry }: FeedErrorProps) {
  const isNotFound = error.kind === "not-found";

  return (
    <div
      className="mt-8 flex flex-col items-start gap-4 rounded-xl border border-red-900 bg-red-950 p-4 text-red-100 sm:flex-row sm:items-center"
      role="alert"
    >
      <Icon className="shrink-0 text-red-300" name="alert" />
      <p className="flex-1">{getErrorMessage(error)}</p>
      {!isNotFound && (
        <button
          className="rounded-lg border border-red-800 px-4 py-2 text-sm font-medium hover:bg-red-900"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      )}
    </div>
  );
}

function getErrorMessage({ kind, resetAt }: GitHubApiError) {
  switch (kind) {
    case "not-found":
      return "This GitHub user does not exist.";
    case "rate-limited":
      return resetAt
        ? `GitHub’s API rate limit was reached. Please try again after ${formatTime(resetAt)}.`
        : "GitHub’s API rate limit was reached. Please try again later.";
    case "unknown":
      return "Something went wrong while loading the activity from GitHub.";
  }
}

interface ActivityFeedProps {
  username: string;
}

interface FeedErrorProps {
  error: GitHubApiError;
  onRetry: () => void;
}
