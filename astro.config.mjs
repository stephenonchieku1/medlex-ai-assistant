import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel/serverless";

import alpinejs from "@astrojs/alpinejs";

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
    alpinejs({ entrypoint: "/src/entrypoint" }),
  ],

  output: "server",
  adapter: vercel({
    functionPerRoute: false,  
    runtime: "nodejs18.x",
  }),
  vite: {
    ssr: {
      noExternal: ["react-dropzone"],
    },
  },
});
