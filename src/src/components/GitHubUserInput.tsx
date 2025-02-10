import React, { useState, useEffect } from "react";

interface GitHubUserInputProps {
  onUserSelect: (username: string) => void;
}

const GitHubUserInput: React.FC<GitHubUserInputProps> = ({ onUserSelect }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    { login: string; avatar_url: string }[]
  >([]);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const fetchUserSuggestions = async (input: string) => {
    if (!input) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.github.com/search/users?q=${input}&per_page=5`
      );
      const data = await response.json();
      setSuggestions(data.items || []);
    } catch (error) {
      console.error("Error fetching GitHub users:", error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      fetchUserSuggestions(value);
    }, 500); // Adjust delay as needed (500ms here)

    setDebounceTimeout(timeout);
  };

  const handleSelectUser = (username: string) => {
    setQuery(username);
    setSuggestions([]);
    onUserSelect(username);
  };

  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Enter GitHub username..."
        className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-400"
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
          {suggestions.map((user) => (
            <li
              key={user.login}
              className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer"
              onClick={() => handleSelectUser(user.login)}
            >
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-8 h-8 rounded-full border border-gray-600"
              />
              <span className="text-white">{user.login}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GitHubUserInput;
