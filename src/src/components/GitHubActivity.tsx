import { useState, useEffect } from "react";
import CommitCard from "./Cards/CommitCard";
import PullRequestCard from "./Cards/PullRequestCard";
import IssueCard from "./Cards/IssueCard";
import ForkCard from "./Cards/ForkCard";
import WatchCard from "./Cards/WatchCard";

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

const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 Minuten Cache-Gültigkeit

const GitHubActivity: React.FC<GitHubActivityProps> = ({ username, GITHUB_TOKEN }) => {
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [rateLimit, setRateLimit] = useState<GitHubRateLimit | null>(null);
  const [canLoadMore, setCanLoadMore] = useState(true);

  const cacheKey = `github_events_${username}`;
  const cacheRateKey = `github_rate_limit`;

  const loadCache = () => {
    const cachedData = localStorage.getItem(cacheKey);
    const cachedRateLimit = localStorage.getItem(cacheRateKey);
    if (cachedData) {
      const { events, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_EXPIRATION_MS) {
        setEvents(events);
        setLoading(false);
      }
    }
    if (cachedRateLimit) {
      const { rateLimit, timestamp } = JSON.parse(cachedRateLimit);
      if (Date.now() - timestamp < CACHE_EXPIRATION_MS) {
        setRateLimit(rateLimit);
        setCanLoadMore(rateLimit.remaining / rateLimit.limit >= 0.5);
      }
    }
  };

  const saveCache = (data: GitHubEvent[]) => {
    localStorage.setItem(cacheKey, JSON.stringify({ events: data, timestamp: Date.now() }));
  };

  const saveRateCache = (rate: GitHubRateLimit) => {
    localStorage.setItem(cacheRateKey, JSON.stringify({ rateLimit: rate, timestamp: Date.now() }));
  };

  const fetchRateLimit = async () => {
    try {
      const response = await fetch("https://api.github.com/rate_limit", {
        headers: {
          Authorization: `token ${GITHUB_TOKEN.githubToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch rate limit");

      const data = await response.json();
      const coreLimit = data.rate || data.rate_limit?.core;
      setRateLimit(coreLimit);
      saveRateCache(coreLimit);

      if (coreLimit.remaining / coreLimit.limit < 0.5) {
        setCanLoadMore(false);
      } else {
        setCanLoadMore(true);
      }
    } catch (error) {
      console.error("Failed to fetch rate limit:", error);
    }
  };

  const fetchEvents = async (pageNum: number) => {
    try {
      const response = await fetch(`https://api.github.com/users/${username}/events?per_page=30&page=${pageNum}`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN.githubToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch GitHub events");

      const newData: GitHubEvent[] = await response.json();

      // 🔥 Duplikate entfernen, indem wir nur Events mit neuer ID hinzufügen
      setEvents((prevEvents) => {
        const uniqueEvents = [...prevEvents, ...newData.filter((event) => !prevEvents.some((e) => e.id === event.id))];
        saveCache(uniqueEvents);
        return uniqueEvents;
      });

      if (newData.length < 30) setHasMore(false);

      await fetchRateLimit();
    } catch (error) {
      console.error("Failed to fetch GitHub events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEvents([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    loadCache();
    fetchEvents(1);
    fetchRateLimit();
  }, [username]);

  const loadMore = () => {
    if (!hasMore || !canLoadMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEvents(nextPage);
  };

  return (
    <div className="w-full space-y-6">
      {loading && events.length === 0 ? (
        <p className="text-gray-400 text-center">Loading GitHub activity...</p>
      ) : events.length > 0 ? (
        <>
          {events.map((event) => {
            const EventCard = (() => {
              switch (event.type) {
                case "PushEvent":
                  return CommitCard;
                case "PullRequestEvent":
                  return PullRequestCard;
                case "IssuesEvent":
                  return IssueCard;
                case "ForkEvent":
                  return ForkCard;
                case "WatchEvent":
                  return WatchCard;
                default:
                  return null;
              }
            })();

            return EventCard ? (
              <div key={event.id}>
                <EventCard {...event} />
              </div>
            ) : null;
          })}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={!canLoadMore}
              className={`w-full font-bold py-2 px-4 rounded ${
                canLoadMore ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-500 text-gray-300 cursor-not-allowed"
              }`}
            >
              {canLoadMore ? "Load more" : "Rate limit exceeded"}
            </button>
          )}
        </>
      ) : (
        <p className="text-gray-400 text-center">No recent GitHub activity found.</p>
      )}
    </div>
  );
};

export default GitHubActivity;
