import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [react()],
  site: "https://recent-github-activity.netlify.app",
  vite: {
    plugins: [tailwindcss()],
  },
});
