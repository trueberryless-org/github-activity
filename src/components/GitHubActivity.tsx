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
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (loading || !hasMore) return;

      setLoading(true);
      try {
        const response = await fetch(`https://api.github.com/users/${username}/events?page=${page}&per_page=30`);
        const data = await response.json();

        if (data.length === 0) {
          setHasMore(false);
        } else {
          setEvents((prevEvents) => [...prevEvents, ...data]);
          setPage((prevPage) => prevPage + 1); // Increment page for the next fetch
        }
      } catch (error) {
        console.error("Failed to fetch GitHub events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [username, loading, hasMore, page]);

  const lastEventRef = (node: HTMLDivElement) => {
    if (loading) return;

    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setHasMore(true);
        }
      },
      { threshold: 1.0 }
    );

    if (node) observer.current.observe(node);
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
    </div>
  );
};

export default GitHubActivity;
