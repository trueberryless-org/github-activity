import { useEffect, useState } from "react";

import {
  getUrlWithUsername,
  getUsernameFromUrl,
  normalizeUsername,
} from "../libs/username";
import { ActivityFeed } from "./ActivityFeed";
import { UserSearch } from "./UserSearch";

const TITLE = "Recent GitHub Activity";

export function ActivityApp() {
  const [username, setUsername] = useState(() =>
    getUsernameFromUrl(new URL(window.location.href))
  );

  useEffect(() => {
    function handlePopState() {
      setUsername(getUsernameFromUrl(new URL(window.location.href)));
    }

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.title = `${username} · ${TITLE}`;
  }, [username]);

  function handleUserSelect(user: string) {
    const nextUsername = normalizeUsername(user);
    if (!nextUsername || nextUsername === username) return;

    setUsername(nextUsername);
    window.history.pushState(
      null,
      "",
      getUrlWithUsername(new URL(window.location.href), nextUsername)
    );
  }

  return (
    <div className="space-y-10">
      <UserSearch onUserSelect={handleUserSelect} />
      <ActivityFeed key={username} username={username} />
    </div>
  );
}
