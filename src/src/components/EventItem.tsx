import type { ReactNode } from "react";

import { formatDateTime, formatTime } from "../libs/date";
import type { EventTone } from "../libs/events";
import {
  formatAction,
  formatExcerpt,
  formatShortSha,
  getEventAppearance,
  getPullRequestAction,
  getPushUrl,
  getReviewVerb,
  stripRefPrefix,
} from "../libs/events";
import type { GitHubEvent } from "../libs/github";
import { getAvatarUrl, getRepoOwner, getRepoUrl } from "../libs/github";
import { Icon } from "./Icon";

const TONE_CLASSES: Record<EventTone, string> = {
  accent: "text-sky-300",
  closed: "text-red-400",
  merged: "text-violet-400",
  neutral: "text-zinc-300",
  open: "text-emerald-400",
  star: "text-amber-300",
};

export function EventItem({ event }: EventItemProps) {
  const { icon, tone } = getEventAppearance(event);
  const createdAt = new Date(event.created_at);
  const { details, summary } = getEventContent(event);

  return (
    <li className="relative flex gap-3 sm:gap-4">
      <span
        className={`relative z-10 mt-2 flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 ${TONE_CLASSES[tone]}`}
      >
        <Icon name={icon} />
      </span>
      <article className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
        <header className="flex items-center justify-between gap-3">
          <a
            className="inline-flex min-w-0 items-center gap-2 rounded text-sm font-medium text-zinc-300 hover:text-white"
            href={getRepoUrl(event.repo.name)}
          >
            <img
              alt=""
              className="size-5 shrink-0 rounded-full bg-zinc-800"
              height="20"
              loading="lazy"
              src={getAvatarUrl(getRepoOwner(event.repo.name), 20)}
              width="20"
            />
            <span className="truncate">{event.repo.name}</span>
          </a>
          <time
            className="shrink-0 text-sm text-zinc-400 tabular-nums"
            dateTime={event.created_at}
            title={formatDateTime(createdAt)}
          >
            {formatTime(createdAt)}
          </time>
        </header>
        <p className="mt-1.5 leading-relaxed text-zinc-100">{summary}</p>
        {details && <div className="mt-2 text-sm text-zinc-400">{details}</div>}
      </article>
    </li>
  );
}

function getEventContent(event: GitHubEvent): EventContent {
  const repoName = event.repo.name;

  switch (event.type) {
    case "CommitCommentEvent":
      return {
        details: <Excerpt text={event.payload.comment.body} />,
        summary: (
          <>
            Commented on a{" "}
            <Link href={event.payload.comment.html_url}>commit</Link> in
          </>
        ),
      };
    case "CreateEvent": {
      const { ref, ref_type } = event.payload;

      return {
        summary:
          ref_type === "repository" || !ref ? (
            <>Created the repository</>
          ) : (
            <>
              Created {ref_type}{" "}
              <Link href={getRepoUrl(repoName, "tree", ref)}>
                <Code>{ref}</Code>
              </Link>
            </>
          ),
      };
    }
    case "DeleteEvent":
      return {
        summary: (
          <>
            Deleted {event.payload.ref_type} <Code>{event.payload.ref}</Code>
          </>
        ),
      };
    case "ForkEvent":
      return {
        summary: (
          <>
            Forked to{" "}
            <Link href={event.payload.forkee.html_url}>
              {event.payload.forkee.full_name}
            </Link>
          </>
        ),
      };
    case "GollumEvent":
      return {
        details: (
          <ul className="space-y-1">
            {event.payload.pages.map((page) => (
              <li key={page.html_url}>
                {formatAction(page.action)}{" "}
                <Link href={page.html_url}>{page.title}</Link>
              </li>
            ))}
          </ul>
        ),
        summary: <>Updated the wiki</>,
      };
    case "IssueCommentEvent": {
      const { comment, issue } = event.payload;

      return {
        details: <Excerpt text={comment.body} />,
        summary: (
          <>
            Commented on {issue.pull_request ? "pull request" : "issue"}{" "}
            <Link href={comment.html_url}>
              {issue.title} #{issue.number}
            </Link>
          </>
        ),
      };
    }
    case "IssuesEvent": {
      const { action, issue } = event.payload;

      return {
        summary: (
          <>
            {formatAction(action)} issue{" "}
            <Link href={issue.html_url}>
              {issue.title} #{issue.number}
            </Link>
          </>
        ),
      };
    }
    case "MemberEvent":
      return {
        summary: (
          <>
            {formatAction(event.payload.action)}{" "}
            <Link href={event.payload.member.html_url}>
              {event.payload.member.login}
            </Link>{" "}
            as a collaborator
          </>
        ),
      };
    case "PublicEvent":
      return { summary: <>Made the repository public</> };
    case "PullRequestEvent": {
      const { number } = event.payload;

      return {
        summary: (
          <>
            {formatAction(getPullRequestAction(event.payload))} pull request{" "}
            <Link href={getRepoUrl(repoName, "pull", number)}>#{number}</Link>
          </>
        ),
      };
    }
    case "PullRequestReviewCommentEvent": {
      const { comment, pull_request } = event.payload;

      return {
        details: <Excerpt text={comment.body} />,
        summary: (
          <>
            Commented on{" "}
            <Link href={comment.html_url}>
              pull request #{pull_request.number}
            </Link>
          </>
        ),
      };
    }
    case "PullRequestReviewEvent": {
      const { pull_request, review } = event.payload;

      return {
        summary: (
          <>
            {getReviewVerb(review.state)}{" "}
            <Link href={review.html_url}>
              pull request #{pull_request.number}
            </Link>
          </>
        ),
      };
    }
    case "PushEvent": {
      const { head, ref } = event.payload;
      const branch = stripRefPrefix(ref);

      return {
        details: (
          <Link href={getPushUrl(repoName, event.payload)}>
            <Code>{formatShortSha(head)}</Code>
            <span className="sr-only"> (view changes)</span>
          </Link>
        ),
        summary: (
          <>
            Pushed to{" "}
            <Link href={getRepoUrl(repoName, "tree", branch)}>
              <Code>{branch}</Code>
            </Link>
          </>
        ),
      };
    }
    case "ReleaseEvent": {
      const { action, release } = event.payload;

      return {
        summary: (
          <>
            {formatAction(action)} release{" "}
            <Link href={release.html_url}>
              {release.name || release.tag_name}
            </Link>
          </>
        ),
      };
    }
    case "WatchEvent":
      return { summary: <>Starred the repository</> };
  }
}

function Link({ children, href }: { children: ReactNode; href: string }) {
  return (
    <a
      className="rounded font-medium break-words text-sky-300 underline-offset-2 hover:underline"
      href={href}
    >
      {children}
    </a>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.85em] wrap-anywhere">
      {children}
    </code>
  );
}

function Excerpt({ text }: { text: string }) {
  return (
    <p className="line-clamp-3 border-l-2 border-zinc-700 pl-3 break-words whitespace-pre-line">
      {formatExcerpt(text)}
    </p>
  );
}

interface EventContent {
  details?: ReactNode;
  summary: ReactNode;
}

interface EventItemProps {
  event: GitHubEvent;
}
