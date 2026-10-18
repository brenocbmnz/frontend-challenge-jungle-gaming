import type { SearchSchemaInput } from "@tanstack/react-router";
import { QueryClient, queryOptions } from "@tanstack/react-query";
import axios from "axios";
import type {
  Cart,
  Catalog,
  CatalogSearch,
  Nft,
  Order,
  Quote,
  User,
  Wallet,
} from "./contracts";
import { get, token } from "./client";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: (count, error) =>
        !axios.isAxiosError(error) || !error.response
          ? count < 1
          : count < 1 && error.response.status >= 500,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});
export function searchParams(search: CatalogSearch) {
  const p = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((v) => p.append(key, v));
    else if (value !== "" && value !== undefined) p.set(key, String(value));
  });
  return p.toString();
}
export const sessionQuery = () =>
  queryOptions({
    queryKey: ["session", token()],
    queryFn: ({ signal }) => get<User>("/session", signal),
    enabled: !!token(),
    retry: false,
  });
export const catalogQuery = (search: CatalogSearch, pageSize = 9) =>
  queryOptions({
    queryKey:
      pageSize === 9 ? ["catalog", search] : ["catalog", search, pageSize],
    queryFn: ({ signal }) =>
      get<Catalog>(
        `/nfts?${searchParams(search)}${pageSize === 9 ? "" : `&pageSize=${pageSize}`}`,
        signal,
      ),
  });
export const nftQuery = (id: string) =>
  queryOptions({
    queryKey: ["nft", id],
    queryFn: ({ signal }) => get<Nft>(`/nfts/${id}`, signal),
  });
function parseCart(value: unknown): Cart {
  if (
    !value ||
    typeof value !== "object" ||
    !("items" in value) ||
    !Array.isArray(value.items) ||
    !("coupon" in value) ||
    typeof value.coupon !== "string" ||
    !value.items.every(
      (item: unknown) =>
        !!item &&
        typeof item === "object" &&
        "nftId" in item &&
        typeof item.nftId === "string" &&
        "edition" in item &&
        ["1/1", "1/10", "1/50", "ABERTA"].includes(String(item.edition)) &&
        "quantity" in item &&
        Number.isInteger(item.quantity) &&
        Number(item.quantity) > 0,
    )
  )
    throw new Error("Não foi possível carregar o carrinho. Tente novamente.");
  return value as Cart;
}
export const cartQuery = (uid: string) =>
  queryOptions({
    queryKey: ["cart", uid],
    queryFn: async ({ signal }) =>
      parseCart(await get<unknown>("/cart", signal)),
  });
export const quoteQuery = (uid: string) =>
  queryOptions({
    queryKey: ["quote", uid],
    queryFn: ({ signal }) => get<Quote>("/quote", signal),
  });
export const favoritesQuery = (uid: string) =>
  queryOptions({
    queryKey: ["favorites", uid],
    queryFn: ({ signal }) => get<string[]>("/favorites", signal),
    enabled: uid !== "guest",
  });
export const walletsQuery = (uid: string) =>
  queryOptions({
    queryKey: ["wallets", uid],
    queryFn: ({ signal }) => get<Wallet[]>("/wallets", signal),
    enabled: uid !== "guest",
  });
export const orderQuery = (id: string, uid: string) =>
  queryOptions({
    queryKey: ["order", uid, id],
    queryFn: ({ signal }) => get<Order>(`/orders/${id}`, signal),
    refetchInterval: (query) =>
      query.state.data?.status === "pending" ? 1500 : false,
  });
export const defaultSearch: CatalogSearch = {
  q: "",
  categories: [],
  networks: [],
  min: "",
  max: "",
  sort: "recent",
  page: 1,
  tab: "all",
};
export function validateSearch(
  raw: Partial<CatalogSearch> & SearchSchemaInput,
): CatalogSearch {
  const list = (v: unknown) =>
    Array.isArray(v)
      ? v.filter((x) => typeof x === "string")
      : typeof v === "string"
        ? [v]
        : [];
  const decimal = (v: unknown) =>
    typeof v === "string" && /^\d+(\.\d{1,18})?$/.test(v) ? v : "";
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    categories: list(raw.categories),
    networks: list(raw.networks),
    min: decimal(raw.min),
    max: decimal(raw.max),
    sort: ["recent", "price-asc", "price-desc", "popular"].includes(
      String(raw.sort),
    )
      ? String(raw.sort)
      : "recent",
    page: Math.max(1, Math.floor(Number(raw.page) || 1)),
    tab: ["all", "new", "trending"].includes(String(raw.tab))
      ? String(raw.tab)
      : "all",
  };
}
