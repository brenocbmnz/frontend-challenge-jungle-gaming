import fs from "node:fs/promises";
import os from "node:os";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";

const directory = "reports/lighthouse";
await fs.mkdir(directory, { recursive: true });
const port = Number(process.env.LIGHTHOUSE_PORT || 4175);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("LIGHTHOUSE_PORT inválida");
const server = spawn(
  process.execPath,
  ["scripts/preview.mjs", "--port", String(port)],
  { stdio: "ignore" },
);
const base = `http://127.0.0.1:${port}`;
let ready = false;
for (let i = 0; i < 60; i++) {
  if (server.exitCode !== null)
    throw new Error(
      "O servidor da auditoria não iniciou. Confira LIGHTHOUSE_PORT.",
    );
  try {
    if ((await fetch(base)).ok) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 500));
}
if (!ready) {
  server.kill("SIGTERM");
  throw new Error("Timeout ao iniciar o servidor da auditoria.");
}
const results = [];
let chromiumVersion = "";
try {
  for (const profile of ["desktop", "mobile"])
    for (const [name, path] of [
      ["inicio", "/"],
      ["detalhe", "/nft/1"],
    ]) {
      const runs = [];
      for (let run = 1; run <= 3; run++) {
        const chrome = await chromium.launch({
          args: [
            "--remote-debugging-port=9333",
            "--headless",
            "--no-sandbox",
            "--disable-dev-shm-usage",
          ],
        });
        try {
          chromiumVersion = chrome.version();
          const flags = {
            port: 9333,
            output: ["html", "json"],
            logLevel: "error",
            onlyCategories: [
              "performance",
              "accessibility",
              "best-practices",
              "seo",
            ],
            formFactor: profile === "desktop" ? "desktop" : "mobile",
            screenEmulation:
              profile === "desktop"
                ? {
                    mobile: false,
                    width: 1440,
                    height: 1000,
                    deviceScaleFactor: 1,
                    disabled: false,
                  }
                : {
                    mobile: true,
                    width: 390,
                    height: 844,
                    deviceScaleFactor: 1,
                    disabled: false,
                  },
          };
          if (profile === "desktop")
            flags.throttling = {
              rttMs: 40,
              throughputKbps: 10240,
              cpuSlowdownMultiplier: 1,
              requestLatencyMs: 0,
              downloadThroughputKbps: 0,
              uploadThroughputKbps: 0,
            };
          const result = await lighthouse(base + path, flags);
          const stem = `${name}-${profile}-${run}`;
          await fs.writeFile(`${directory}/${stem}.html`, result.report[0]);
          await fs.writeFile(`${directory}/${stem}.json`, result.report[1]);
          const lhr = result.lhr;
          const scores = Object.fromEntries(
            Object.entries(lhr.categories).map(([k, v]) => [
              k,
              Math.round(v.score * 100),
            ]),
          );
          const metrics = {
            LCP: lhr.audits["largest-contentful-paint"].numericValue,
            CLS: lhr.audits["cumulative-layout-shift"].numericValue,
            TBT: lhr.audits["total-blocking-time"].numericValue,
          };
          runs.push({ scores, metrics });
          console.log(stem, JSON.stringify({ scores, metrics }));
        } finally {
          await chrome.close();
        }
      }
      const median = (values) => [...values].sort((a, b) => a - b)[1];
      const scores = Object.fromEntries(
        Object.keys(runs[0].scores).map((k) => [
          k,
          median(runs.map((r) => r.scores[k])),
        ]),
      );
      const metrics = Object.fromEntries(
        Object.keys(runs[0].metrics).map((k) => [
          k,
          median(runs.map((r) => r.metrics[k])),
        ]),
      );
      results.push({ page: name, profile, runs, median: { scores, metrics } });
    }
  const pkg = JSON.parse(
    await fs.readFile("node_modules/lighthouse/package.json", "utf8"),
  );
  const report = {
    date: new Date().toISOString(),
    environment: {
      node: process.version,
      lighthouse: pkg.version,
      chromium: chromiumVersion,
      os: `${os.type()} ${os.release()}`,
      cpu: os.cpus()[0]?.model,
      notes:
        "Build otimizado com Brotli/gzip no preview, mocks padrão ativos e versões responsivas dos assets originais locais. Sem simplificações exclusivas para auditoria. O host compartilhado pode afetar as medições.",
    },
    results,
  };
  await fs.writeFile(
    `${directory}/summary.json`,
    JSON.stringify(report, null, 2),
  );
  const lines = [
    "# Lighthouse",
    "",
    `Execução: ${report.date}. Node ${process.version}; Lighthouse ${pkg.version}.`,
    "",
    "Medianas de três execuções por página e perfil. LCP/TBT em ms.",
    "",
    "| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...results.map(
      (r) =>
        `| ${r.page} | ${r.profile} | ${r.median.scores.performance} | ${r.median.scores.accessibility} | ${r.median.scores["best-practices"]} | ${r.median.scores.seo} | ${Math.round(r.median.metrics.LCP)} | ${r.median.metrics.CLS.toFixed(3)} | ${Math.round(r.median.metrics.TBT)} |`,
    ),
    "",
    "Ambiente e resultados completos: [summary.json](summary.json). Os relatórios individuais HTML/JSON acompanham esta pasta.",
    "",
    "A simulação carrega MSW e o banco local antes da aplicação. Os PNGs originais são preservados e a interface usa derivações WebP responsivas. O preview serve Brotli/gzip para os mesmos arquivos estáticos da entrega. Metas abaixo do solicitado exigem atenção ao custo inicial dos mocks e ao trabalho de CPU; consulte os diagnósticos em cada HTML.",
  ];
  await fs.writeFile(`${directory}/README.md`, lines.join("\n") + "\n");
} finally {
  server.kill("SIGTERM");
}
