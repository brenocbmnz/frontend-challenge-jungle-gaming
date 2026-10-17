import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nfts } from "./src/mocks/fixtures";
const artworkById = Object.fromEntries(
  nfts.map((nft) => [nft.id, nft.image.slice(0, -4)]),
);
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "route-artwork-preload",
      transformIndexHtml() {
        return [
          {
            tag: "script",
            injectTo: "head",
            children: `(() => {
          const artworks = ${JSON.stringify(artworkById)};
          const path = location.pathname;
          const id = /^\\/nft\\/([^/]+)\\/?$/.exec(path)?.[1];
          const base = path === '/' ? artworks['1'] : artworks[id];
          if (!base) return;
          const link = document.createElement('link');
          link.rel = 'preload'; link.as = 'image'; link.fetchPriority = 'high';
          link.href = base + '-480.webp';
          link.setAttribute('imagesrcset', [320, 480, 960].map(size => base + '-' + size + '.webp ' + size + 'w').join(', '));
          link.setAttribute('imagesizes', path === '/' ? '(max-width:768px) 40vw, 450px' : '(max-width:768px) calc(100vw - 56px), 412px');
          document.head.appendChild(link);
        })();`,
          },
        ];
      },
    },
  ],
  build: { chunkSizeWarningLimit: 700 },
  server: {
    port: 5173,
    watch: {
      ignored: [
        "**/playwright-report/**",
        "**/test-results/**",
        "**/reports/**",
      ],
    },
  },
});
