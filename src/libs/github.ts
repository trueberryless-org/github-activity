const GITHUB_API_URL = "https://api.github.com";
const GITHUB_URL = "https://github.com";

const EVENTS_PER_PAGE = 30;
const USER_SUGGESTIONS_COUNT = 5;

const NEXT_LINK_RE = /<[^>]+>;\s*rel="next"/;

export async function fetchUserEvents(
  username: string,
  page: number,
  signal: AbortSignal
): Promise<GitHubEventsPage> {
  const url = new URL(
    `/users/${encodeURIComponent(username)}/events/public`,
    GITHUB_API_URL
  );
  url.searchParams.set("per_page", String(EVENTS_PER_PAGE));
  url.searchParams.set("page", String(page));

  const response = await fetchGitHub(url, signal);
  const events: GitHubEvent[] = await response.json();

  return {
    events,
    nextPage: hasNextPage(response) ? page + 1 : null,
  };
}

export async function searchUsers(
  query: string,
  signal: AbortSignal
): Promise<GitHubUser[]> {
  const url = new URL("/search/users", GITHUB_API_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("per_page", String(USER_SUGGESTIONS_COUNT));

  const response = await fetchGitHub(url, signal);
  const { items }: { items: GitHubUser[] } = await response.json();

  return items;
}

export function getProfileUrl(login: string) {
  return `${GITHUB_URL}/${login}`;
}

export function getAvatarUrl(login: string, size: number) {
  return `${GITHUB_URL}/${login}.png?size=${size * 2}`;
}

export function getRepoUrl(repoName: string, ...segments: (string | number)[]) {
  return [`${GITHUB_URL}/${repoName}`, ...segments].join("/");
}

export function getRepoOwner(repoName: string) {
  const [owner] = repoName.split("/");

  return owner ?? repoName;
}

export class GitHubApiError extends Error {
  readonly kind: GitHubApiErrorKind;
  readonly resetAt: Date | null;

  constructor(kind: GitHubApiErrorKind, resetAt: Date | null = null) {
    super(`GitHub API request failed: ${kind}.`);
    this.kind = kind;
    this.resetAt = resetAt;
  }
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function fetchGitHub(url: URL, signal: AbortSignal) {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
    signal,
  });

  if (response.ok) return response;

  if (response.status === 404) throw new GitHubApiError("not-found");

  if (isRateLimited(response)) {
    throw new GitHubApiError("rate-limited", getRateLimitReset(response));
  }

  throw new GitHubApiError("unknown");
}

function hasNextPage(response: Response) {
  return NEXT_LINK_RE.test(response.headers.get("link") ?? "");
}

function isRateLimited(response: Response) {
  return (
    (response.status === 403 || response.status === 429) &&
    response.headers.get("x-ratelimit-remaining") === "0"
  );
}

function getRateLimitReset(response: Response) {
  const reset = Number(response.headers.get("x-ratelimit-reset"));

  return Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000) : null;
}

export type GitHubApiErrorKind = "not-found" | "rate-limited" | "unknown";

export interface GitHubEventsPage {
  events: GitHubEvent[];
  nextPage: number | null;
}

export interface GitHubUser {
  avatar_url: string;
  login: string;
}

interface GitHubComment {
  body: string;
  html_url: string;
}

interface GitHubIssue {
  html_url: string;
  number: number;
  pull_request?: unknown;
  title: string;
}

interface GitHubPullRequestReference {
  merged?: boolean;
  number: number;
}

interface GitHubBaseEvent<TType extends string, TPayload> {
  created_at: string;
  id: string;
  payload: TPayload;
  repo: { name: string };
  type: TType;
}

export type GitHubEvent =
  | GitHubBaseEvent<"CommitCommentEvent", { comment: GitHubComment }>
  | GitHubBaseEvent<
      "CreateEvent",
      { ref: string | null; ref_type: "branch" | "repository" | "tag" }
    >
  | GitHubBaseEvent<"DeleteEvent", { ref: string; ref_type: "branch" | "tag" }>
  | GitHubBaseEvent<
      "ForkEvent",
      { forkee: { full_name: string; html_url: string } }
    >
  | GitHubBaseEvent<
      "GollumEvent",
      { pages: { action: string; html_url: string; title: string }[] }
    >
  | GitHubBaseEvent<
      "IssueCommentEvent",
      { action: string; comment: GitHubComment; issue: GitHubIssue }
    >
  | GitHubBaseEvent<"IssuesEvent", { action: string; issue: GitHubIssue }>
  | GitHubBaseEvent<
      "MemberEvent",
      { action: string; member: { html_url: string; login: string } }
    >
  | GitHubBaseEvent<"PublicEvent", Record<string, never>>
  | GitHubBaseEvent<
      "PullRequestEvent",
      {
        action: string;
        number: number;
        pull_request: GitHubPullRequestReference;
      }
    >
  | GitHubBaseEvent<
      "PullRequestReviewCommentEvent",
      { comment: GitHubComment; pull_request: GitHubPullRequestReference }
    >
  | GitHubBaseEvent<
      "PullRequestReviewEvent",
      {
        pull_request: GitHubPullRequestReference;
        review: { html_url: string; state: string };
      }
    >
  | GitHubBaseEvent<"PushEvent", { before: string; head: string; ref: string }>
  | GitHubBaseEvent<
      "ReleaseEvent",
      {
        action: string;
        release: { html_url: string; name: string | null; tag_name: string };
      }
    >
  | GitHubBaseEvent<"WatchEvent", { action: string }>;

export type GitHubEventType = GitHubEvent["type"];
