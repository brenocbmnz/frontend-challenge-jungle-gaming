import type {
  Cart,
  Nft,
  Order,
  Quote,
  Scenario,
  User,
  Wallet,
  Edition,
} from "../api/contracts";
import { nfts, users, wallets } from "./fixtures";
import { decimal, wei } from "../lib/money";
type Account = User & { passwordHash: string };
interface StoredOrder extends Order {
  dueAt: number;
  outcome: "confirmed" | "refused";
  key: string;
  payload: string;
}
interface Database {
  nfts: Nft[];
  users: Account[];
  wallets: Record<string, Wallet[]>;
  favorites: Record<string, string[]>;
  carts: Record<string, Cart>;
  sessions: Record<string, { userId: string; expiresAt: number }>;
  orders: StoredOrder[];
  scenario: Scenario;
  counter: number;
  connections: Record<
    string,
    { walletId: string; provider: string; network: string }
  >;
}
const KEY = "kurio.mock.v1";
export async function hash(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode("kurio-fixture:" + value),
  );
  return Array.from(new Uint8Array(bytes), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}
export async function fresh(): Promise<Database> {
  const passwordHash = await hash("Kurio123!");
  return {
    nfts: structuredClone(nfts),
    users: users.map((u) => ({ ...u, passwordHash })),
    wallets: Object.fromEntries(
      users.map((u) => [u.id, structuredClone(wallets)]),
    ),
    favorites: {},
    carts: {},
    sessions: {},
    connections: {},
    orders: [],
    scenario: "default",
    counter: 0,
  };
}
export let db: Database;
export async function initialize() {
  try {
    const saved = localStorage.getItem(KEY);
    db = saved ? JSON.parse(saved) : await fresh();
  } catch {
    db = await fresh();
  }
  db.connections ??= {};
  // Upgrade existing fixtures without resetting accounts, carts or orders.
  for (const nft of db.nfts) {
    if (nft.rarity !== "rare" && nft.rarity !== "common") {
      nft.rarity =
        nfts.find((fixture) => fixture.id === nft.id)?.rarity ?? "common";
    }
  }
  save();
}
export function save() {
  localStorage.setItem(KEY, JSON.stringify(db));
}
export async function reset(scenario: Scenario = "default") {
  db = await fresh();
  db.scenario = scenario;
  save();
}
export function publicUser(user: Account): User {
  const { passwordHash: _, ...safe } = user;
  void _;
  return safe;
}
export function cart(owner: string): Cart {
  return db.carts[owner] ?? (db.carts[owner] = { items: [], coupon: "" });
}
export function stock(nft: Nft, edition: Edition) {
  return Math.min(
    nft.stock,
    nft.editions.find((e) => e.id === edition)?.stock ?? 0,
  );
}
export function quote(owner: string): Quote {
  const c = cart(owner);
  const issues: string[] = [];
  const lines = c.items.flatMap((item) => {
    const n = db.nfts.find((n) => n.id === item.nftId);
    if (!n) {
      issues.push("NFT indisponível");
      return [];
    }
    const available = stock(n, item.edition);
    if (available < item.quantity)
      issues.push(`${n.name}: apenas ${available} edição(ões) disponível(is)`);
    return [
      {
        ...item,
        name: n.name,
        token: n.token,
        image: n.image,
        price: n.price,
        subtotal: decimal(wei(n.price) * BigInt(item.quantity)),
        version: n.version,
        stock: available,
      },
    ];
  });
  const subtotal = lines.reduce((a, l) => a + wei(l.subtotal), 0n);
  const discount = c.coupon === "KURIO10" ? subtotal / 10n : 0n;
  const fee = lines.length ? wei("0.016") : 0n;
  const id = JSON.stringify({
    lines: lines.map((l) => [
      l.nftId,
      l.edition,
      l.quantity,
      l.price,
      l.version,
    ]),
    coupon: c.coupon,
  });
  return {
    id,
    lines,
    subtotal: decimal(subtotal),
    discount: decimal(discount),
    fee: decimal(fee),
    total: decimal(subtotal - discount + fee),
    coupon: c.coupon,
    valid: lines.length > 0 && issues.length === 0,
    issues,
  };
}
export function settle(order: StoredOrder) {
  if (order.status !== "pending" || Date.now() < order.dueAt) return false;
  if (order.outcome === "confirmed") {
    const enough = order.quote.lines.every((l) => {
      const n = db.nfts.find((n) => n.id === l.nftId);
      return n && stock(n, l.edition) >= l.quantity;
    });
    if (!enough) order.outcome = "refused";
  }
  order.status = order.outcome;
  order.version++;
  if (order.status === "confirmed") {
    for (const line of order.quote.lines) {
      const n = db.nfts.find((n) => n.id === line.nftId)!;
      n.stock -= line.quantity;
      n.editions.find((e) => e.id === line.edition)!.stock -= line.quantity;
      n.version++;
      const c = cart(order.userId);
      const item = c.items.find(
        (i) => i.nftId === line.nftId && i.edition === line.edition,
      );
      if (item) item.quantity = Math.max(0, item.quantity - line.quantity);
      c.items = c.items.filter((i) => i.quantity > 0);
    }
  }
  save();
  return true;
}
