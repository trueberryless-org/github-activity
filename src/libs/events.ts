import type { IconName } from "../components/Icon";
import type { GitHubEvent, GitHubEventType } from "./github";
import { getRepoUrl } from "./github";

const SUPPORTED_EVENT_TYPES = new Set<string>([
  "CommitCommentEvent",
  "CreateEvent",
  "DeleteEvent",
  "ForkEvent",
  "GollumEvent",
  "IssueCommentEvent",
  "IssuesEvent",
  "MemberEvent",
  "PublicEvent",
  "PullRequestEvent",
  "PullRequestReviewCommentEvent",
  "PullRequestReviewEvent",
  "PushEvent",
  "ReleaseEvent",
  "WatchEvent",
] satisfies GitHubEventType[]);

const REF_PREFIX_RE = /^refs\/(?:heads|tags)\//;
const EMPTY_SHA_RE = /^0+$/;
const SHORT_SHA_LENGTH = 7;
const BLANK_LINES_RE = /\n\s*\n/g;

const REVIEW_VERBS = new Map([
  ["approved", "Approved"],
  ["changes_requested", "Requested changes on"],
]);

export function getEventAppearance(event: GitHubEvent): EventAppearance {
  switch (event.type) {
    case "CommitCommentEvent":
    case "IssueCommentEvent":
    case "PullRequestReviewCommentEvent":
      return { icon: "comment", tone: "neutral" };
    case "CreateEvent":
      return {
        icon:
          event.payload.ref_type === "tag"
            ? "tag"
            : event.payload.ref_type === "repository"
              ? "repo"
              : "branch",
        tone: "accent",
      };
    case "DeleteEvent":
      return { icon: "trash", tone: "closed" };
    case "ForkEvent":
      return { icon: "fork", tone: "neutral" };
    case "GollumEvent":
      return { icon: "book", tone: "neutral" };
    case "IssuesEvent":
      return event.payload.action === "closed"
        ? { icon: "issue-closed", tone: "merged" }
        : { icon: "issue-opened", tone: "open" };
    case "MemberEvent":
      return { icon: "person-add", tone: "accent" };
    case "PublicEvent":
      return { icon: "globe", tone: "accent" };
    case "PullRequestEvent": {
      const action = getPullRequestAction(event.payload);
      if (action === "merged") return { icon: "merge", tone: "merged" };
      if (action === "closed") return { icon: "pull-request", tone: "closed" };
      return { icon: "pull-request", tone: "open" };
    }
    case "PullRequestReviewEvent":
      if (event.payload.review.state === "approved")
        return { icon: "check", tone: "open" };
      if (event.payload.review.state === "changes_requested")
        return { icon: "diff", tone: "closed" };
      return { icon: "eye", tone: "neutral" };
    case "PushEvent":
      return { icon: "commit", tone: "neutral" };
    case "ReleaseEvent":
      return { icon: "tag", tone: "accent" };
    case "WatchEvent":
      return { icon: "star", tone: "star" };
  }
}

export function getPullRequestAction({
  action,
  pull_request,
}: PullRequestEventPayload) {
  return action === "closed" && pull_request.merged ? "merged" : action;
}

export function getDisplayedEvents(events: GitHubEvent[]) {
  return events
    .filter((event) => SUPPORTED_EVENT_TYPES.has(event.type))
    .toSorted((a, b) => b.created_at.localeCompare(a.created_at));
}

export function mergeEvents(events: GitHubEvent[], newEvents: GitHubEvent[]) {
  const eventsById = new Map(events.map((event) => [event.id, event]));

  for (const event of newEvents) {
    eventsById.set(event.id, event);
  }

  return [...eventsById.values()];
}

export function formatExcerpt(text: string) {
  return text.trim().replace(BLANK_LINES_RE, "\n");
}

export function stripRefPrefix(ref: string) {
  return ref.replace(REF_PREFIX_RE, "");
}

export function formatShortSha(sha: string) {
  return sha.slice(0, SHORT_SHA_LENGTH);
}

export function getPushUrl(
  repoName: string,
  { before, head }: { before: string; head: string }
) {
  return EMPTY_SHA_RE.test(before)
    ? getRepoUrl(repoName, "commit", head)
    : getRepoUrl(repoName, "compare", `${before}...${head}`);
}

export function formatAction(action: string) {
  const words = action.replaceAll("_", " ");

  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

export function getReviewVerb(state: string) {
  return REVIEW_VERBS.get(state) ?? "Reviewed";
}

type PullRequestEventPayload = Extract<
  GitHubEvent,
  { type: "PullRequestEvent" }
>["payload"];

export interface EventAppearance {
  icon: IconName;
  tone: EventTone;
}

export type EventTone =
  "accent" | "closed" | "merged" | "neutral" | "open" | "star";
