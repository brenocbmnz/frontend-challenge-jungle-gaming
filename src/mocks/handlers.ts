import { http, HttpResponse, delay } from "msw";
import type {
  CartItem,
  Collector,
  CatalogSearch,
  Edition,
  Scenario,
  Wallet,
} from "../api/contracts";
import {
  cart,
  db,
  hash,
  publicUser,
  quote,
  reset,
  save,
  settle,
  stock,
} from "./database";
import { changeNft, disconnect, nftUpdated, orderUpdated } from "./realtime";
import { wei } from "../lib/money";
const fail = (
  message: string,
  status = 400,
  fields?: Record<string, string>,
  code?: string,
) => HttpResponse.json({ message, fields, code }, { status });
function userId(request: Request) {
  const token =
    request.headers.get("authorization")?.replace("Bearer ", "") || "";
  const s = db.sessions[token];
  return s && s.expiresAt > Date.now() && db.scenario !== "expired"
    ? s.userId
    : undefined;
}
function owner(request: Request) {
  return (
    userId(request) || `guest:${request.headers.get("x-guest-id") || "default"}`
  );
}
const unauthorized = () =>
  fail("Sua sessão expirou. Entre novamente para continuar.", 401);
async function body<T>(request: Request) {
  return (await request.json()) as T;
}
async function latency(request: Request) {
  if (db.scenario === "slow") await delay(1800);
  else if (db.scenario === "out-of-order")
    await delay(
      new URL(request.url).searchParams.get("q")?.length === 1 ? 1400 : 100,
    );
  else await delay(0);
}
function notifyOrder(order: (typeof db.orders)[number]) {
  if (!db.orders.includes(order)) return;
  if (settle(order)) {
    const safe = structuredClone(order);
    orderUpdated({
      id: `order-${order.id}-${order.version}`,
      resourceId: order.id,
      version: order.version,
      userId: order.userId,
      order: safe,
    });
    for (const line of order.quote.lines) {
      const n = db.nfts.find((n) => n.id === line.nftId)!;
      nftUpdated({
        id: `nft-${n.id}-${n.version}`,
        resourceId: n.id,
        version: n.version,
        nft: structuredClone(n),
      });
    }
  }
}
export const handlers = [
  http.all("/api/*", async ({ request }) => {
    await latency(request);
    if (db.scenario === "offline") return HttpResponse.error();
    if (db.scenario === "server-error")
      return fail(
        "Serviço temporariamente indisponível. Tente novamente.",
        503,
      );
  }),
  http.get("/api/nfts", ({ request }) => {
    const p = new URL(request.url).searchParams;
    let items = [...db.nfts];
    const q = (p.get("q") || "").toLowerCase();
    const cats = p.getAll("categories");
    const networks = p.getAll("networks");
    const min = p.get("min");
    const max = p.get("max");
    if (q) items = items.filter((n) => n.name.toLowerCase().includes(q));
    if (cats.length) items = items.filter((n) => cats.includes(n.category));
    if (networks.length)
      items = items.filter((n) => networks.includes(n.network));
    if (min) items = items.filter((n) => wei(n.price) >= wei(min));
    if (max) items = items.filter((n) => wei(n.price) <= wei(max));
    const sort = p.get("sort");
    if (sort === "price-asc" || sort === "price-desc")
      items.sort(
        (a, b) =>
          (wei(a.price) > wei(b.price) ? 1 : -1) *
          (sort === "price-desc" ? -1 : 1),
      );
    else if (sort === "popular" || p.get("tab") === "trending")
      items.sort((a, b) => b.popularity - a.popularity);
    else items.sort((a, b) => b.created - a.created);
    if (db.scenario === "empty") items = [];
    const total = items.length;
    const page = Math.max(1, Number(p.get("page")) || 1);
    return HttpResponse.json({
      items: items.slice((page - 1) * 9, page * 9),
      total,
      pages: Math.ceil(total / 9),
      counts: Object.fromEntries(
        db.nfts.flatMap((n) => [
          [n.network, db.nfts.filter((i) => i.network === n.network).length],
          [n.category, db.nfts.filter((i) => i.category === n.category).length],
        ]),
      ),
    });
  }),
  http.get("/api/nfts/:id", ({ params }) => {
    const n = db.nfts.find((n) => n.id === params.id);
    return n ? HttpResponse.json(n) : fail("NFT não encontrado.", 404);
  }),
  http.get("/api/session", ({ request }) => {
    const uid = userId(request);
    if (!uid) return unauthorized();
    return HttpResponse.json(publicUser(db.users.find((u) => u.id === uid)!));
  }),
  http.post("/api/login", async ({ request }) => {
    const b = await body<{ email: string; password: string }>(request);
    const u = db.users.find(
      (u) => u.email.toLowerCase() === b.email.toLowerCase() && u.passwordHash,
    );
    if (!u || u.passwordHash !== (await hash(b.password)))
      return fail("E-mail ou senha incorretos.", 422);
    const token = crypto.randomUUID();
    db.sessions[token] = { userId: u.id, expiresAt: Date.now() + 3600000 };
    const guest = cart(
      `guest:${request.headers.get("x-guest-id") || "default"}`,
    );
    const destination = cart(u.id);
    for (const item of guest.items) {
      const exists = destination.items.find(
        (i) => i.nftId === item.nftId && i.edition === item.edition,
      );
      const n = db.nfts.find((n) => n.id === item.nftId)!;
      if (exists)
        exists.quantity = Math.min(
          stock(n, item.edition),
          exists.quantity + item.quantity,
        );
      else
        destination.items.push({
          ...item,
          quantity: Math.min(stock(n, item.edition), item.quantity),
        });
    }
    guest.items = [];
    if (guest.coupon) destination.coupon = guest.coupon;
    save();
    return HttpResponse.json({ token, user: publicUser(u) });
  }),
  http.post("/api/register", async ({ request }) => {
    const b = await body<{
      username: string;
      email: string;
      password: string;
      confirm: string;
    }>(request);
    const fields: Record<string, string> = {};
    if (!/^[\w.-]{3,30}$/.test(b.username || ""))
      fields.username = "Use de 3 a 30 letras, números, pontos ou traços.";
    if (!/^\S+@\S+\.\S+$/.test(b.email || ""))
      fields.email = "Informe um e-mail válido.";
    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(b.password || ""))
      fields.password = "Use ao menos 8 caracteres, uma maiúscula e um número.";
    if (b.confirm !== b.password)
      fields.confirm = "As senhas devem ser iguais.";
    if (Object.keys(fields).length)
      return fail("Revise os campos indicados.", 422, fields);
    if (db.users.some((u) => u.email === b.email || u.username === b.username))
      return fail("E-mail ou nome de usuário já cadastrado.", 409, {
        email: "Já existe uma conta com estes dados.",
      });
    const u = {
      id: crypto.randomUUID(),
      name: b.username,
      username: b.username,
      email: b.email,
      ens: "",
      walletNickname: "Principal",
      avatar: "",
      passwordHash: await hash(b.password),
    };
    db.users.push(u);
    db.wallets[u.id] = [];
    save();
    return HttpResponse.json(publicUser(u), { status: 201 });
  }),
  http.post("/api/logout", ({ request }) => {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") || "";
    const currentSession = db.sessions[token];
    if (currentSession) delete db.connections[currentSession.userId];
    delete db.sessions[token];
    save();
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/favorites", ({ request }) => {
    const uid = userId(request);
    return uid ? HttpResponse.json(db.favorites[uid] || []) : unauthorized();
  }),
  http.put("/api/favorites/:id", async ({ request, params }) => {
    const uid = userId(request);
    if (!uid) return unauthorized();
    if (db.scenario === "favorite-error")
      return fail("Não foi possível atualizar o favorito.", 503);
    if (!db.nfts.some((n) => n.id === params.id))
      return fail("NFT não encontrado.", 404);
    const { favorite } = await body<{ favorite: boolean }>(request);
    const ids = new Set(db.favorites[uid] || []);
    if (favorite) ids.add(String(params.id));
    else ids.delete(String(params.id));
    db.favorites[uid] = [...ids];
    save();
    return HttpResponse.json(db.favorites[uid]);
  }),
  http.get("/api/cart", ({ request }) =>
    HttpResponse.json(cart(owner(request))),
  ),
  http.put("/api/cart", async ({ request }) => {
    const b = await body<CartItem>(request);
    const n = db.nfts.find((n) => n.id === b.nftId);
    if (!n) return fail("NFT não encontrado.", 404);
    if (!Number.isInteger(b.quantity) || b.quantity < 0)
      return fail("Quantidade inválida.", 422);
    if (b.quantity > stock(n, b.edition))
      return fail(
        `Quantidade indisponível. Limite: ${stock(n, b.edition)}.`,
        409,
      );
    const c = cart(owner(request));
    c.items = c.items.filter(
      (i) => i.nftId !== b.nftId || i.edition !== b.edition,
    );
    if (b.quantity) c.items.push(b);
    save();
    return HttpResponse.json(c);
  }),
  http.post("/api/cart/coupon", async ({ request }) => {
    const { code } = await body<{ code: string }>(request);
    const normalized = code.trim().toUpperCase();
    if (normalized && normalized !== "KURIO10")
      return fail(
        normalized === "EXPIRED" ? "Este cupom expirou." : "Cupom inválido.",
        422,
      );
    const c = cart(owner(request));
    c.coupon = normalized;
    save();
    return HttpResponse.json(quote(owner(request)));
  }),
  http.get("/api/quote", ({ request }) =>
    HttpResponse.json(quote(owner(request))),
  ),
  http.post("/api/quote", ({ request }) =>
    HttpResponse.json(quote(owner(request))),
  ),
  http.get("/api/profile", ({ request }) => {
    const uid = userId(request);
    return uid
      ? HttpResponse.json(publicUser(db.users.find((u) => u.id === uid)!))
      : unauthorized();
  }),
  http.patch("/api/profile", async ({ request }) => {
    const uid = userId(request);
    if (!uid) return unauthorized();
    const b = await body<
      Partial<(typeof db.users)[number]> & {
        currentPassword?: string;
        newPassword?: string;
        confirm?: string;
      }
    >(request);
    const u = db.users.find((u) => u.id === uid)!;
    const fields: Record<string, string> = {};
    if (!b.name?.trim()) fields.name = "Informe seu nome.";
    if (!b.username || b.username.length < 3)
      fields.username = "Use ao menos 3 caracteres.";
    if (!b.email || !/^\S+@\S+\.\S+$/.test(b.email))
      fields.email = "Informe um e-mail válido.";
    if (
      db.users.some(
        (v) =>
          v.id !== uid && (v.email === b.email || v.username === b.username),
      )
    )
      fields.email = "E-mail ou usuário já cadastrado.";
    if (b.newPassword) {
      if ((await hash(b.currentPassword || "")) !== u.passwordHash)
        fields.currentPassword = "Senha atual incorreta.";
      if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(b.newPassword))
        fields.newPassword = "Use ao menos 8 caracteres, maiúscula e número.";
      if (b.newPassword !== b.confirm)
        fields.confirm = "As senhas devem ser iguais.";
    }
    if (
      b.avatar &&
      (!b.avatar.startsWith("data:image/") || b.avatar.length > 1400000)
    )
      fields.avatar = "Escolha uma imagem de até 1 MB.";
    if (Object.keys(fields).length)
      return fail("Revise os campos indicados.", 422, fields);
    for (const k of [
      "name",
      "username",
      "email",
      "ens",
      "walletNickname",
      "avatar",
    ] as const)
      if (b[k] !== undefined) u[k] = b[k]!;
    if (b.newPassword) u.passwordHash = await hash(b.newPassword);
    save();
    return HttpResponse.json(publicUser(u));
  }),
  http.get("/api/wallets", ({ request }) => {
    const uid = userId(request);
    return uid ? HttpResponse.json(db.wallets[uid] || []) : unauthorized();
  }),
  http.put("/api/wallets/:id", async ({ request, params }) => {
    const uid = userId(request);
    if (!uid) return unauthorized();
    const b = await body<Wallet>(request);
    const fields: Record<string, string> = {};
    if (!b.label?.trim()) fields.label = "Informe um apelido.";
    if (b.email && !/^\S+@\S+\.\S+$/.test(b.email))
      fields.email = "Informe um e-mail válido.";
    if (!["Ethereum", "Polygon", "Solana"].includes(b.network))
      fields.network = "Escolha uma rede.";
    const valid =
      b.network === "Solana"
        ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(b.address)
        : /^0x[a-fA-F0-9]{40}$/.test(b.address) ||
          /^[a-z0-9.-]+\.eth$/.test(b.address);
    if (!valid) fields.address = "Endereço incompatível com a rede.";
    if (!["MetaMask", "WalletConnect", "Coinbase Wallet"].includes(b.provider))
      fields.provider = "Escolha uma carteira.";
    if (Object.keys(fields).length)
      return fail("Revise a carteira.", 422, fields);
    const list = db.wallets[uid] || [];
    if (
      list.some(
        (w) =>
          w.id !== params.id &&
          w.address.toLowerCase() === b.address.toLowerCase(),
      )
    )
      return fail("Esta carteira já está cadastrada.", 409);
    if (b.primary) list.forEach((w) => (w.primary = false));
    const item = {
      ...b,
      id: params.id === "new" ? crypto.randomUUID() : String(params.id),
      primary: list.length === 0 || b.primary,
    };
    db.wallets[uid] = [...list.filter((w) => w.id !== item.id), item];
    save();
    return HttpResponse.json(item);
  }),
  http.post("/api/wallets/connect", async ({ request }) => {
    const uid = userId(request);
    if (!uid) return unauthorized();
    if (db.scenario === "wallet-refused")
      return fail("Conexão recusada pela carteira.", 409);
    const { walletId, network, provider } = await body<{
      walletId: string;
      network: string;
      provider: string;
    }>(request);
    const w = db.wallets[uid]?.find((w) => w.id === walletId);
    if (!w || w.network !== network)
      return fail("Selecione uma carteira e uma rede compatíveis.", 422);
    if (!["MetaMask", "WalletConnect", "Coinbase Wallet"].includes(provider))
      return fail("Escolha um provedor de carteira.", 422);
    db.connections[uid] = { walletId, network, provider };
    save();
    return HttpResponse.json({ connected: true, wallet: { ...w, provider } });
  }),
  http.post("/api/wallets/disconnect", ({ request }) => {
    const uid = userId(request);
    if (!uid) return unauthorized();
    delete db.connections[uid];
    save();
    return HttpResponse.json({ connected: false });
  }),
  http.post("/api/orders", async ({ request }) => {
    const uid = userId(request);
    if (!uid) return unauthorized();
    const key = request.headers.get("idempotency-key");
    if (!key) return fail("Chave de idempotência obrigatória.", 422);
    const b = await body<{
      quoteId: string;
      walletId: string;
      note: string;
      collector: Collector;
    }>(request);
    const payload = JSON.stringify(b);
    const existing = db.orders.find((o) => o.userId === uid && o.key === key);
    if (existing) {
      if (existing.payload !== payload)
        return fail("Chave já utilizada com dados diferentes.", 409);
      notifyOrder(existing);
      return HttpResponse.json(existing);
    }
    if (
      !b.collector?.name ||
      !/^\S+@\S+\.\S+$/.test(b.collector.email) ||
      !b.collector.username
    )
      return fail("Preencha os dados do colecionador.", 422);
    const connection = db.connections[uid];
    if (!connection || connection.walletId !== b.walletId)
      return fail(
        "Conecte a carteira selecionada.",
        409,
        undefined,
        "WALLET_DISCONNECTED",
      );
    const wallet = db.wallets[uid]?.find((w) => w.id === b.walletId);
    if (!wallet) return fail("Cadastre e selecione uma carteira.", 422);
    if (db.scenario === "price-change" || db.scenario === "sold-out") {
      changeNft(cart(uid).items[0]?.nftId, db.scenario === "sold-out");
      db.scenario = "default";
      save();
    }
    const q = quote(uid);
    if (b.quoteId !== q.id)
      return fail(
        "A cotação mudou. Revise os valores e confirme novamente.",
        409,
        undefined,
        "QUOTE_CHANGED",
      );
    if (!q.valid) return fail(q.issues.join(". ") || "Carrinho vazio.", 409);
    const o = {
      id: `KURIO-${++db.counter}`,
      userId: uid,
      status: "pending" as const,
      quote: structuredClone(q),
      wallet: structuredClone({ ...wallet, provider: connection.provider }),
      collector: structuredClone(b.collector),
      createdAt: new Date().toISOString(),
      transaction: `0x${crypto.randomUUID().replaceAll("-", "")}`,
      version: 1,
      note: b.note || "",
      dueAt: Date.now() + 1800,
      outcome:
        db.scenario === "payment-refused"
          ? ("refused" as const)
          : ("confirmed" as const),
      key,
      payload,
    };
    db.orders.push(o);
    save();
    setTimeout(() => notifyOrder(o), 1850);
    if (db.scenario === "order-timeout") {
      await delay(11000);
      return HttpResponse.error();
    }
    return HttpResponse.json(o, { status: 201 });
  }),
  http.get("/api/orders", ({ request }) => {
    const uid = userId(request);
    if (!uid) return unauthorized();
    db.orders.filter((o) => o.userId === uid).forEach(notifyOrder);
    return HttpResponse.json(db.orders.filter((o) => o.userId === uid));
  }),
  http.get("/api/orders/by-key/:key", ({ request, params }) => {
    const uid = userId(request);
    if (!uid) return unauthorized();
    const o = db.orders.find((o) => o.userId === uid && o.key === params.key);
    if (!o) return fail("Pedido não encontrado.", 404);
    notifyOrder(o);
    return HttpResponse.json(o);
  }),
  http.get("/api/orders/:id", ({ request, params }) => {
    const uid = userId(request);
    if (!uid) return unauthorized();
    const o = db.orders.find((o) => o.userId === uid && o.id === params.id);
    if (!o) return fail("Pedido não encontrado.", 404);
    notifyOrder(o);
    return HttpResponse.json(o);
  }),
  http.get("/__mock/state", () => HttpResponse.json({ scenario: db.scenario })),
  http.post("/__mock/reset", async ({ request }) => {
    const b = await body<{ scenario?: Scenario }>(request);
    disconnect();
    await reset(b.scenario);
    return HttpResponse.json({ ok: true });
  }),
  http.post("/__mock/scenario", async ({ request }) => {
    const { scenario } = await body<{ scenario: Scenario }>(request);
    db.scenario = scenario;
    save();
    return HttpResponse.json({ ok: true });
  }),
  http.post("/__mock/event", async ({ request }) => {
    const { type, id, duplicate, stale } = await body<{
      type: string;
      id?: string;
      duplicate?: boolean;
      stale?: boolean;
    }>(request);
    if (type === "disconnect") {
      disconnect();
      return HttpResponse.json({ ok: true });
    }
    if (type === "expire") {
      for (const s of Object.values(db.sessions)) s.expiresAt = 0;
      save();
      return HttpResponse.json({ ok: true });
    }
    const event = changeNft(id, type === "sold-out");
    if (event && duplicate) nftUpdated(event);
    if (event && stale)
      nftUpdated({
        ...event,
        id: event.id + "-old",
        version: event.version - 1,
        nft: { ...event.nft, price: "0.01", version: event.version - 1 },
      });
    return HttpResponse.json({ ok: true });
  }),
];
// Compile-time checks keep URL and edition contracts aligned with transport.
export type MockCatalogContract = CatalogSearch;
export type MockEditionContract = Edition;
