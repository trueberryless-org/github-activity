# Recent GitHub Activity

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)
[![Netlify Status](https://api.netlify.com/api/v1/badges/2d07c3c7-e700-47d5-b450-1965b4c5c6d7/deploy-status)](https://app.netlify.com/sites/recent-github-activity/deploys)

Browse the recent public GitHub activity of any user: pushes, pull requests, issues, reviews, releases, stars and more.

**[recent-github-activity.netlify.app](https://recent-github-activity.netlify.app)**

## Features

- Search any GitHub user, or link to one directly with `?user=<username>`.
- Activity grouped by day, with support for all common public event types.
- Responses are cached in the browser for one hour to stay within the GitHub API rate limit.
- Requests go straight from the browser to the unauthenticated GitHub API, so no token is needed or exposed.

## Development

```sh
pnpm install
pnpm dev
```

| Command         | Action                                |
| --------------- | ------------------------------------- |
| `pnpm dev`      | Start the local development server    |
| `pnpm build`    | Build the site to `./dist/`           |
| `pnpm check`    | Type check the project                |
| `pnpm lint`     | Lint with oxlint                      |
| `pnpm knip`     | Find unused files and dependencies    |
| `pnpm test`     | Run the unit tests                    |
| `pnpm test:e2e` | Run the end-to-end tests (Playwright) |

## License

Licensed under the MIT license, Copyright © trueberryless.

See [LICENSE](https://github.com/trueberryless-org/gh-activity/blob/main/LICENSE) for more information.
