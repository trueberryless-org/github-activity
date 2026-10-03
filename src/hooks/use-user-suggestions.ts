import { useEffect, useState } from "react";

import type { GitHubUser } from "../libs/github";
import { isAbortError, searchUsers } from "../libs/github";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_LENGTH = 2;

export function useUserSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<GitHubUser[]>([]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < SEARCH_MIN_LENGTH) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setSuggestions(await searchUsers(trimmedQuery, controller.signal));
      } catch (error) {
        if (isAbortError(error)) return;

        console.warn("[gh-activity] Failed to search GitHub users.", error);
        setSuggestions([]);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return suggestions;
}
