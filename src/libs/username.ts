export const DEFAULT_USERNAME = "trueberryless";
const USERNAME_SEARCH_PARAM = "user";

const WHITESPACE_RE = /\s+/g;
const INVALID_CHARACTERS_RE = /[^a-z0-9-]/g;
const REPEATED_HYPHENS_RE = /-+/g;
const EDGE_HYPHENS_RE = /^-|-$/g;

export function normalizeUsername(username: string) {
  return username
    .toLowerCase()
    .trim()
    .replace(WHITESPACE_RE, "-")
    .replace(INVALID_CHARACTERS_RE, "")
    .replace(REPEATED_HYPHENS_RE, "-")
    .replace(EDGE_HYPHENS_RE, "");
}

export function getUsernameFromUrl(url: URL) {
  const username = normalizeUsername(
    url.searchParams.get(USERNAME_SEARCH_PARAM) ?? ""
  );

  return username || DEFAULT_USERNAME;
}

export function getUrlWithUsername(url: URL, username: string) {
  const urlWithUsername = new URL(url);
  urlWithUsername.searchParams.set(USERNAME_SEARCH_PARAM, username);

  return urlWithUsername;
}
