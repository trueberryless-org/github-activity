import { useReducer, useEffect, useMemo } from "react";
import CommitCard from "./Cards/CommitCard";
import PullRequestCard from "./Cards/PullRequestCard";
import IssueCard from "./Cards/IssueCard";
import ForkCard from "./Cards/ForkCard";
import WatchCard from "./Cards/WatchCard";

const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 60 minutes

interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string; url: string };
  payload: any;
}

interface GitHubRateLimit {
  limit: number;
  remaining: number;
}

interface GitHubActivityProps {
  username: string;
  GITHUB_TOKEN: { githubToken: string };
}

type State = {
  events: GitHubEvent[];
  loading: boolean;
  page: number;
  hasMore: boolean;
  rateLimit: GitHubRateLimit | null;
  canLoadMore: boolean;
};

type Action =
  | { type: "SET_EVENTS"; events: GitHubEvent[] }
  | { type: "ADD_EVENTS"; newEvents: GitHubEvent[] }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_PAGE"; page: number }
  | { type: "SET_HAS_MORE"; hasMore: boolean }
  | { type: "SET_RATE_LIMIT"; rateLimit: GitHubRateLimit }
  | { type: "SET_CAN_LOAD_MORE"; canLoadMore: boolean }
  | { type: "RESET" };

const initialState: State = {
  events: [],
  loading: true,
  page: 1,
  hasMore: true,
  rateLimit: null,
  canLoadMore: true,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_EVENTS":
      return { ...state, events: action.events };
    case "ADD_EVENTS":
      return {
        ...state,
        events: [
          ...state.events,
          ...action.newEvents.filter(
            (event) => !state.events.some((e) => e.id === event.id)
          ),
        ],
      };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_PAGE":
      return { ...state, page: action.page };
    case "SET_HAS_MORE":
      return { ...state, hasMore: action.hasMore };
    case "SET_RATE_LIMIT":
      return { ...state, rateLimit: action.rateLimit };
    case "SET_CAN_LOAD_MORE":
      return { ...state, canLoadMore: action.canLoadMore };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const GitHubActivity: React.FC<GitHubActivityProps> = ({
  username,
  GITHUB_TOKEN,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const cacheKey = useMemo(() => `github_events_${username}`, [username]);

  useEffect(() => {
    dispatch({ type: "RESET" }); // Reset state when username changes

    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const { events, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_EXPIRATION_MS) {
        dispatch({ type: "SET_EVENTS", events });
        dispatch({ type: "SET_LOADING", loading: false });

        // Determine the correct page based on the number of cached events
        const cachedPage = Math.ceil(events.length / 30);
        dispatch({ type: "SET_PAGE", page: cachedPage });

        fetchRateLimit();

        return; // No need to fetch since cache is valid
      }
    }

    fetchEvents(1); // Fetch if no cache or cache is expired
    fetchRateLimit();
  }, [username]);

  const fetchEvents = async (pageNum: number) => {
    try {
      const response = await fetch(
        `https://api.github.com/users/${username}/events?per_page=30&page=${pageNum}`,
        {
          headers: { Authorization: `token ${GITHUB_TOKEN.githubToken}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch GitHub events");

      const newData: GitHubEvent[] = await response.json();
      dispatch({ type: "ADD_EVENTS", newEvents: newData });

      if (pageNum === 1) {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ events: newData, timestamp: Date.now() })
        );
      } else {
        const existingCache = JSON.parse(
          localStorage.getItem(cacheKey) || "{}"
        );
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            events: [...(existingCache.events || []), ...newData],
            timestamp: Date.now(),
          })
        );
      }

      dispatch({ type: "SET_HAS_MORE", hasMore: newData.length === 30 });
      fetchRateLimit();
    } catch (error) {
      console.error("Failed to fetch GitHub events:", error);
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  };

  const fetchRateLimit = async () => {
    try {
      const response = await fetch("https://api.github.com/rate_limit", {
        headers: { Authorization: `token ${GITHUB_TOKEN.githubToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch rate limit");

      const data = await response.json();
      const coreLimit = data.rate || data.rate_limit?.core;

      dispatch({ type: "SET_RATE_LIMIT", rateLimit: coreLimit });
      dispatch({
        type: "SET_CAN_LOAD_MORE",
        canLoadMore: coreLimit.remaining / coreLimit.limit >= 0.5,
      });
    } catch (error) {
      console.error("Failed to fetch rate limit:", error);
    }
  };

  const loadMore = () => {
    if (!state.hasMore || !state.canLoadMore) return;
    const nextPage = state.page + 1;
    dispatch({ type: "SET_PAGE", page: nextPage });
    fetchEvents(nextPage);
  };

  return (
    <div className="w-full space-y-6">
      {state.loading && state.events.length === 0 ? (
        <p className="text-gray-400 text-center">Loading GitHub activity...</p>
      ) : state.events.length > 0 ? (
        <>
          {state.events.map((event) => {
            const EventCard =
              {
                PushEvent: CommitCard,
                PullRequestEvent: PullRequestCard,
                IssuesEvent: IssueCard,
                ForkEvent: ForkCard,
                WatchEvent: WatchCard,
              }[event.type] || null;

            return EventCard ? <EventCard key={event.id} {...event} /> : null;
          })}
          {state.hasMore && (
            <button
              onClick={loadMore}
              disabled={!state.canLoadMore}
              className="w-full font-bold py-2 px-4 rounded bg-blue-500 hover:bg-blue-600 text-white"
            >
              {state.canLoadMore ? "Load more" : "Rate limit exceeded"}
            </button>
          )}
        </>
      ) : (
        <p className="text-gray-400 text-center">
          No recent GitHub activity found.
        </p>
      )}
    </div>
  );
};

export default GitHubActivity;
