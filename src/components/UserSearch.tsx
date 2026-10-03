import { useId, useState } from "react";
import type { KeyboardEvent, SubmitEvent } from "react";

import { useUserSuggestions } from "../hooks/use-user-suggestions";
import { getAvatarUrl } from "../libs/github";
import { Icon } from "./Icon";

export function UserSearch({ onUserSelect }: UserSearchProps) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = useUserSuggestions(query);

  const inputId = `${id}-input`;
  const listboxId = `${id}-listbox`;
  const isExpanded = isOpen && suggestions.length > 0;
  const activeSuggestion = isExpanded ? suggestions[activeIndex] : undefined;

  function selectUser(username: string) {
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
    onUserSelect(username);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const username = activeSuggestion?.login ?? query.trim();
    if (username) selectUser(username);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        if (suggestions.length === 0) return;

        event.preventDefault();
        const offset = event.key === "ArrowDown" ? 1 : -1;
        setIsOpen(true);
        setActiveIndex((index) =>
          isExpanded
            ? (index + offset + suggestions.length) % suggestions.length
            : offset === 1
              ? 0
              : suggestions.length - 1
        );
        return;
      }
      case "Escape":
        if (!isExpanded) return;

        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        return;
    }
  }

  return (
    <form
      className="relative flex w-full flex-col gap-2 sm:flex-row"
      onSubmit={handleSubmit}
      role="search"
    >
      <label className="sr-only" htmlFor={inputId}>
        GitHub username
      </label>
      <div className="relative flex-1">
        <Icon
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400"
          name="search"
        />
        <input
          aria-activedescendant={
            activeSuggestion ? `${id}-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isExpanded}
          autoCapitalize="none"
          autoComplete="off"
          className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 pr-3 pl-10 text-zinc-100 placeholder:text-zinc-500 hover:border-zinc-600 focus:border-sky-400"
          id={inputId}
          onBlur={() => setIsOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search a GitHub username…"
          role="combobox"
          spellCheck={false}
          type="text"
          value={query}
        />
        <ul
          aria-label="Suggested users"
          className={`absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl shadow-black/40 ${isExpanded ? "" : "hidden"}`}
          id={listboxId}
          role="listbox"
        >
          {suggestions.map((user, index) => (
            <li
              aria-selected={index === activeIndex}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-zinc-100 ${index === activeIndex ? "bg-zinc-800" : "hover:bg-zinc-800"}`}
              id={`${id}-option-${index}`}
              key={user.login}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectUser(user.login)}
              role="option"
            >
              <img
                alt=""
                className="size-7 rounded-full bg-zinc-800"
                height="28"
                src={getAvatarUrl(user.login, 28)}
                width="28"
              />
              <span className="truncate">{user.login}</span>
            </li>
          ))}
        </ul>
      </div>
      <button
        className="h-11 shrink-0 rounded-lg bg-sky-400 px-5 font-semibold text-zinc-950 hover:bg-sky-300"
        type="submit"
      >
        Show activity
      </button>
      <p aria-live="polite" className="sr-only">
        {isExpanded
          ? `${suggestions.length} suggestions available. Use the up and down arrow keys to navigate.`
          : ""}
      </p>
    </form>
  );
}

interface UserSearchProps {
  onUserSelect: (username: string) => void;
}
