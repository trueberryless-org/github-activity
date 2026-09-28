import type { ReactNode } from "react";

const ICONS = {
  alert: (
    <>
      <path d="M8 2 14.5 13.5h-13Z" />
      <path d="M8 6.5v3" />
      <circle cx="8" cy="11.5" r=".25" />
    </>
  ),
  book: (
    <>
      <path d="M3.25 2.25h9.5v11.5h-9.5Z" />
      <path d="M5.75 2.25v11.5" />
    </>
  ),
  branch: (
    <>
      <circle cx="4.5" cy="3.5" r="1.75" />
      <circle cx="4.5" cy="12.5" r="1.75" />
      <circle cx="11.5" cy="4.5" r="1.75" />
      <path d="M4.5 5.25v5.5M11.5 6.25c0 3-7 1.5-7 4.5" />
    </>
  ),
  check: <path d="m3 8.5 3 3 7-7" />,
  comment: <path d="M2.75 3.25h10.5v7.5h-6l-3 2.5v-2.5h-1.5Z" />,
  commit: (
    <>
      <circle cx="8" cy="8" r="2.5" />
      <path d="M1.25 8H5.5M10.5 8h4.25" />
    </>
  ),
  diff: <path d="M8 3.5v6M5 6.5h6M5 12.5h6" />,
  eye: (
    <>
      <path d="M1.5 8S4 3.25 8 3.25 14.5 8 14.5 8 12 12.75 8 12.75 1.5 8 1.5 8Z" />
      <circle cx="8" cy="8" r="2" />
    </>
  ),
  fork: (
    <>
      <circle cx="4" cy="3.5" r="1.75" />
      <circle cx="12" cy="3.5" r="1.75" />
      <circle cx="8" cy="12.5" r="1.75" />
      <path d="M4 5.25v.5a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-.5M8 7.75v3" />
    </>
  ),
  globe: (
    <>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M1.75 8h12.5M8 1.75c-3.5 3.5-3.5 9 0 12.5M8 1.75c3.5 3.5 3.5 9 0 12.5" />
    </>
  ),
  "issue-closed": (
    <>
      <circle cx="8" cy="8" r="6.25" />
      <path d="m5.5 8 1.75 1.75 3.25-3.5" />
    </>
  ),
  "issue-opened": (
    <>
      <circle cx="8" cy="8" r="6.25" />
      <circle cx="8" cy="8" r="1" />
    </>
  ),
  merge: (
    <>
      <circle cx="4" cy="3.5" r="1.75" />
      <circle cx="4" cy="12.5" r="1.75" />
      <circle cx="12" cy="9" r="1.75" />
      <path d="M4 5.25v5.5M4 5.25c0 2.5 2.5 3.75 6.25 3.75" />
    </>
  ),
  "person-add": (
    <>
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1.75 13.5a4.25 4.25 0 0 1 8.5 0M12.5 5.5v4M10.5 7.5h4" />
    </>
  ),
  "pull-request": (
    <>
      <circle cx="4" cy="3.5" r="1.75" />
      <circle cx="4" cy="12.5" r="1.75" />
      <circle cx="12" cy="12.5" r="1.75" />
      <path d="M4 5.25v5.5M12 10.75V6a2 2 0 0 0-2-2H7M8.5 2.5 7 4l1.5 1.5" />
    </>
  ),
  repo: (
    <>
      <path d="M3.25 12V3.25a1 1 0 0 1 1-1h8.5v9.5h-8.5a1 1 0 0 0 0 2h8.5" />
    </>
  ),
  search: (
    <>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3.5 3.5" />
    </>
  ),
  star: (
    <path d="m8 1.75 1.9 3.85 4.2.6-3.05 3 .7 4.2L8 11.4l-3.75 2 .7-4.2-3.05-3 4.2-.6Z" />
  ),
  tag: (
    <>
      <path d="M2.25 2.25h5l6.5 6.5-5 5-6.5-6.5Z" />
      <circle cx="5" cy="5" r=".75" />
    </>
  ),
  trash: (
    <path d="M2.5 4h11M6 4V2.5h4V4M3.75 4l.75 9.5h7l.75-9.5M6.75 7v4M9.25 7v4" />
  ),
} satisfies Record<string, ReactNode>;

export function Icon({ className, name }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 16 16"
      width="16"
    >
      {ICONS[name]}
    </svg>
  );
}

export type IconName = keyof typeof ICONS;

interface IconProps {
  className?: string;
  name: IconName;
}
