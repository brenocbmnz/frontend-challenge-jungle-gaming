import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { ARTWORK_WIDTHS } from "./src/lib/artwork";
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
      name: "bootstrap-module-preloads",
      transformIndexHtml: {
        order: "post",
        handler(_html, context) {
          if (!context.bundle) return [];
          const bundle = context.bundle;
          const entry = Object.values(bundle).find(
            (output) => output.type === "chunk" && output.isEntry,
          );
          if (!entry || entry.type !== "chunk") return [];
          const initialModules = new Set<string>();
          function include(fileName: string) {
            if (initialModules.has(fileName)) return;
            const output = bundle[fileName];
            if (!output || output.type !== "chunk") return;
            initialModules.add(fileName);
            output.imports.forEach(include);
          }
          // Discover the app and mocks together with the entry. Keep route/dialog
          // dynamic imports lazy and keep bootstrap's worker-ready barrier intact.
          entry.dynamicImports.forEach(include);
          return [...initialModules].map((fileName) => ({
            tag: "link",
            attrs: {
              rel: "modulepreload",
              crossorigin: "",
              href: `/${fileName}`,
            },
            injectTo: "head-prepend" as const,
          }));
        },
      },
    },
    {
      name: "route-artwork-preload",
      transformIndexHtml() {
        return [
          {
            tag: "script",
            injectTo: "head",
            children: `(() => {
          const artworks = ${JSON.stringify(artworkById)};
          const widths = ${JSON.stringify(ARTWORK_WIDTHS)};
          const path = location.pathname;
          const id = /^\\/nft\\/([^/]+)\\/?$/.exec(path)?.[1];
          const bases = path === '/' ? (location.search ? [artworks['1']] : [artworks['1'], artworks['2'], artworks['3']]) : [artworks[id]];
          bases.forEach((base, index) => {
          if (!base) return;
          const link = document.createElement('link');
          link.rel = 'preload'; link.as = 'image'; link.fetchPriority = index === 0 || index === 2 ? 'high' : 'low';
          link.href = base + '-480.webp';
          link.setAttribute('imagesrcset', widths.map(size => base + '-' + size + '.webp ' + size + 'w').join(', '));
          link.setAttribute('imagesizes', path === '/' ? (index === 0 ? '(max-width:768px) 40vw, 450px' : '(max-width:768px) 45vw, 450px') : '(max-width:768px) calc(100vw - 56px), 404px');
          document.head.appendChild(link);
          });
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
