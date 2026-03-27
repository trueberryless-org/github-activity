import { useEffect, useState } from "react";

import GitHubUserInput from "../components/GitHubUserInput";
import GitHubActivity from "./GitHubActivity";

function toSlug(username: string): string {
  return username
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getUsernameFromUrl(): string {
  if (typeof window === "undefined") return "trueberryless";
  const params = new URLSearchParams(window.location.search);
  return params.get("user") || "trueberryless";
}

export default function CommitListPage(githubToken: any) {
  const [username, setUsername] = useState(getUsernameFromUrl);

  useEffect(() => {
    const handlePopState = () => {
      setUsername(getUsernameFromUrl());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleUserSelect = (user: string) => {
    const slug = toSlug(user);
    setUsername(slug);
    const url = new URL(window.location.href);
    url.searchParams.set("user", slug);
    window.history.pushState({ username: slug }, "", url.toString());
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <GitHubUserInput onUserSelect={handleUserSelect} />
      <h3 className="w-full text-2xl font-bold text-white">
        Showing latest GitHub activity for {username}
      </h3>
      <GitHubActivity username={username} GITHUB_TOKEN={githubToken} />
    </div>
  );
}
