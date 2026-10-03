import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const now = Date.now();

const events = [
  {
    created_at: new Date(now - 60_000).toISOString(),
    id: "1",
    payload: { action: "started" },
    repo: { name: "octocat/hello" },
    type: "WatchEvent",
  },
  {
    created_at: new Date(now - 120_000).toISOString(),
    id: "2",
    payload: { before: "1111111111111111", head: "2222222222222222", ref: "refs/heads/main" },
    repo: { name: "octocat/hello" },
    type: "PushEvent",
  },
];

async function mockGitHub(page: Page, status = 200) {
  await page.route("https://api.github.com/users/*/events/public*", (route) =>
    route.fulfill({ body: JSON.stringify(status === 200 ? events : {}), contentType: "application/json", status }),
  );
  await page.route("https://api.github.com/search/users*", (route) =>
    route.fulfill({
      body: JSON.stringify({ items: [{ avatar_url: "", login: "octocat" }] }),
      contentType: "application/json",
    }),
  );
  await page.route("https://github.com/*.png*", (route) => route.fulfill({ body: "", status: 204 }));
}

test("shows the activity of the default user", async ({ page }) => {
  await mockGitHub(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Recent GitHub Activity");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("trueberryless");
  await expect(page.getByText("Starred the repository")).toBeVisible();
  await expect(page.getByText(/Pushed to/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
});

test("shows the user from the url", async ({ page }) => {
  await mockGitHub(page);
  await page.goto("/?user=octocat");

  await expect(page.getByRole("heading", { level: 2 })).toHaveText("octocat");
  await expect(page).toHaveTitle("octocat · Recent GitHub Activity");
});

test("searches for another user and picks a suggestion", async ({ page }) => {
  await mockGitHub(page);
  await page.goto("/");

  await page.getByRole("combobox", { name: "GitHub username" }).fill("octo");
  await page.getByRole("option", { name: "octocat" }).click();

  await expect(page).toHaveURL(/\?user=octocat$/);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("octocat");
});

test("submits a typed username with the keyboard", async ({ page }) => {
  await mockGitHub(page);
  await page.goto("/");

  await page.getByRole("combobox", { name: "GitHub username" }).fill("Hubot");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\?user=hubot$/);
});

test("explains that a user does not exist", async ({ page }) => {
  await mockGitHub(page, 404);
  await page.goto("/?user=nobody");

  await expect(page.getByRole("alert")).toContainText("This GitHub user does not exist.");
});

test("has the canonical url and the standard Open Graph image", async ({ page }) => {
  await mockGitHub(page);
  await page.goto("/");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://gh-activity.netlify.app/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://gh-activity.netlify.app/og-image.png",
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/favicon.svg");
});

test.describe("accessibility", () => {
  test("has no violations", async ({ page }) => {
    await mockGitHub(page);
    await page.goto("/");
    await expect(page.getByText("Starred the repository")).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();

    expect(violations.map(({ id, nodes }) => `${id}: ${nodes.map(({ target }) => target.join(" ")).join(", ")}`)).toEqual([]);
  });

  test("does not scroll horizontally", async ({ page }) => {
    await mockGitHub(page);
    await page.goto("/");
    await expect(page.getByText("Starred the repository")).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

    expect(overflow).toBeLessThanOrEqual(0);
  });
});
