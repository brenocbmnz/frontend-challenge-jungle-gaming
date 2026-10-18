export type Network = "Ethereum" | "Polygon" | "Solana";
export type Edition = "1/1" | "1/10" | "1/50" | "ABERTA";
export type Rarity = "common" | "rare";
export interface Nft {
  id: string;
  name: string;
  token: string;
  price: string;
  previousPrice?: string;
  image: string;
  category: string;
  rarity: Rarity;
  network: Network;
  stock: number;
  version: number;
  editions: { id: Edition; stock: number }[];
  created: number;
  popularity: number;
}
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  ens: string;
  walletNickname: string;
  avatar: string;
}
export interface Wallet {
  id: string;
  label: string;
  address: string;
  network: Network;
  provider: string;
  primary: boolean;
  displayName?: string;
  email?: string;
  profileName?: string;
  ens?: string;
  secondaryAddress?: string;
  referral?: string;
}
export interface CartItem {
  nftId: string;
  edition: Edition;
  quantity: number;
}
export interface Cart {
  items: CartItem[];
  coupon: string;
}
export interface QuoteLine extends CartItem {
  token?: string;
  name: string;
  image: string;
  price: string;
  subtotal: string;
  version: number;
  stock: number;
}
export interface Quote {
  id: string;
  lines: QuoteLine[];
  subtotal: string;
  discount: string;
  fee: string;
  total: string;
  coupon: string;
  valid: boolean;
  issues: string[];
}
export interface Order {
  collector: Collector;
  id: string;
  userId: string;
  status: "pending" | "confirmed" | "refused";
  quote: Quote;
  wallet: Wallet;
  createdAt: string;
  transaction: string;
  version: number;
  note: string;
}
export interface CatalogSearch {
  q: string;
  categories: string[];
  networks: string[];
  min: string;
  max: string;
  sort: string;
  page: number;
  tab: string;
}
export interface Catalog {
  items: Nft[];
  total: number;
  pages: number;
  counts: Record<string, number>;
}
export interface ApiError {
  message: string;
  fields?: Record<string, string>;
  code?: string;
}
export type Scenario =
  | "default"
  | "empty"
  | "slow"
  | "out-of-order"
  | "offline"
  | "server-error"
  | "expired"
  | "favorite-error"
  | "price-change"
  | "sold-out"
  | "order-timeout"
  | "payment-refused"
  | "wallet-refused";
export interface ResourceEvent {
  id: string;
  resourceId: string;
  version: number;
  userId?: string;
}
export interface NftEvent extends ResourceEvent {
  /** Compra que originou a atualização de estoque, quando aplicável. */
  orderId?: string;
  nft: Nft;
}
export interface OrderEvent extends ResourceEvent {
  order: Order;
}

export interface Collector {
  name: string;
  email: string;
  username: string;
  profileName?: string;
  ens?: string;
  secondaryWallet?: string;
  referralCode?: string;
  walletNickname?: string;
}
