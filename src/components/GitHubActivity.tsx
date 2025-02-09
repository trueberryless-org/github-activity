import { useState, useEffect, useRef } from "react";
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

interface GitHubActivityProps {
  username: string;
}

const GitHubActivity: React.FC<GitHubActivityProps> = ({ username }) => {
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loadedEvents, setLoadedEvents] = useState(0); // Track loaded events
  const [maxEntries, setMaxEntries] = useState(100); // Max number of events to load (change as needed)
  const [retryAfter, setRetryAfter] = useState<number | null>(null); // Store rate limit retry time
  const observer = useRef<IntersectionObserver | null>(null);

  // Reset all states when username changes
  useEffect(() => {
    setEvents([]);
    setLoading(false);
    setHasMore(true);
    setPage(1);
    setLoadedEvents(0);
    setMaxEntries(100); // Reset maxEntries when username changes
    setRetryAfter(null); // Reset retry time when username changes
  }, [username]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (loading || !hasMore || loadedEvents >= maxEntries || retryAfter) return;

      setLoading(true);
      try {
        const response = await fetch(`https://api.github.com/users/${username}/events?page=${page}&per_page=30`);

        if (!response.ok) {
          // Handle rate limiting
          if (response.status === 429) {
            const retryDelay = response.headers.get("Retry-After");
            if (retryDelay) {
              setRetryAfter(parseInt(retryDelay, 10)); // Set retry time
              console.log(`Rate limited. Retrying after ${retryDelay} seconds...`);
            }
            throw new Error("Rate limit exceeded, retrying after delay.");
          }
          throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.length === 0) {
          setHasMore(false);
        } else {
          setEvents((prevEvents) => [...prevEvents, ...data]);
          setLoadedEvents((prev) => prev + data.length); // Increment loaded events
          setPage((prevPage) => prevPage + 1);
        }
      } catch (error) {
        console.error("Error fetching GitHub events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [username, loading, hasMore, page, loadedEvents, maxEntries, retryAfter]);

  useEffect(() => {
    // If rate-limited, wait for the retry time before making another request
    if (retryAfter) {
      const timer = setTimeout(() => {
        setRetryAfter(null); // Reset retry time after delay
      }, retryAfter * 1000); // Convert seconds to milliseconds
      return () => clearTimeout(timer); // Cleanup the timeout if the component is unmounted
    }
  }, [retryAfter]);

  const lastEventRef = (node: HTMLDivElement) => {
    if (loading || retryAfter) return;

    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          // Delay the loading of next set of events to avoid rate limits
          setTimeout(() => {
            setHasMore(true);
          }, 5000); // Delay in milliseconds (adjust as needed)
        }
      },
      { threshold: 1.0 }
    );

    if (node) observer.current.observe(node);
  };

  const handleLoadMore = () => {
    setMaxEntries((prevMax) => prevMax + 100); // Load more events (double the maxEntries)
  };

  return (
    <div className="w-full space-y-6">
      {loading && events.length === 0 ? (
        <p className="text-gray-400 text-center">Loading GitHub activity...</p>
      ) : events.length > 0 ? (
        events.map((event, index) => {
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

          return (
            <div ref={index === events.length - 1 ? lastEventRef : null} key={event.id}>
              {EventCard ? <EventCard {...event} /> : null}
            </div>
          );
        })
      ) : (
        <p className="text-gray-400 text-center">No recent GitHub activity found.</p>
      )}

      {loading && <p className="text-gray-400 text-center">Loading more events...</p>}

      {/* Show the "Load more" button when the maxEntries is reached */}
      {loadedEvents >= maxEntries && !loading && hasMore && (
        <div className="text-center">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={handleLoadMore}>
            Load further entries
          </button>
        </div>
      )}

      {/* Show a message when rate-limited */}
      {retryAfter && (
        <div className="text-center">
          <p className="text-gray-400">Rate limit reached. Retrying after {retryAfter} seconds...</p>
        </div>
      )}
    </div>
  );
};

export default GitHubActivity;
