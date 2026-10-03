import { useCallback, useEffect, useReducer, useRef } from "react";

import { getCachedActivity, setCachedActivity } from "../libs/cache";
import { mergeEvents } from "../libs/events";
import type { GitHubEvent } from "../libs/github";
import { GitHubApiError, fetchUserEvents, isAbortError } from "../libs/github";

const INITIAL_STATE: ActivityState = {
  error: null,
  events: [],
  nextPage: 1,
  status: "loading",
};

export function useUserActivity(username: string) {
  const [state, dispatch] = useReducer(
    activityReducer,
    username,
    getInitialActivityState
  );
  const controllerRef = useRef<AbortController | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const loadPage = useCallback(
    async (page: number) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      dispatch({ type: "load", isFirstPage: page === 1 });

      try {
        const { events, nextPage } = await fetchUserEvents(
          username,
          page,
          controller.signal
        );
        const mergedEvents = mergeEvents(
          page === 1 ? [] : stateRef.current.events,
          events
        );

        setCachedActivity(username, { events: mergedEvents, nextPage });
        dispatch({ type: "loaded", events: mergedEvents, nextPage });
      } catch (error) {
        if (isAbortError(error)) return;

        dispatch({
          type: "failed",
          error:
            error instanceof GitHubApiError
              ? error
              : new GitHubApiError("unknown"),
        });
      }
    },
    [username]
  );

  useEffect(() => {
    if (stateRef.current.status === "loading") void loadPage(1);

    return () => controllerRef.current?.abort();
  }, [loadPage]);

  const loadMore = useCallback(() => {
    const { nextPage, status } = stateRef.current;
    if (nextPage === null || status === "loading-more") return;

    void loadPage(nextPage);
  }, [loadPage]);

  const retry = useCallback(() => {
    const { events, nextPage } = stateRef.current;

    void loadPage(events.length === 0 ? 1 : (nextPage ?? 1));
  }, [loadPage]);

  return { ...state, loadMore, retry };
}

function getInitialActivityState(username: string): ActivityState {
  const cachedActivity = getCachedActivity(username);
  if (!cachedActivity) return INITIAL_STATE;

  return {
    error: null,
    events: cachedActivity.events,
    nextPage: cachedActivity.nextPage,
    status: "ready",
  };
}

function activityReducer(
  state: ActivityState,
  action: ActivityAction
): ActivityState {
  switch (action.type) {
    case "load":
      return action.isFirstPage
        ? { ...INITIAL_STATE }
        : { ...state, error: null, status: "loading-more" };
    case "loaded":
      return {
        error: null,
        events: action.events,
        nextPage: action.nextPage,
        status: "ready",
      };
    case "failed":
      return { ...state, error: action.error, status: "error" };
  }
}

type ActivityAction =
  | { type: "failed"; error: GitHubApiError }
  | { type: "load"; isFirstPage: boolean }
  | { type: "loaded"; events: GitHubEvent[]; nextPage: number | null };

interface ActivityState {
  error: GitHubApiError | null;
  events: GitHubEvent[];
  nextPage: number | null;
  status: "error" | "loading" | "loading-more" | "ready";
}
