import type { Nft, User, Wallet } from "../api/contracts";
export const categories = [
  "Arte digital",
  "Fotografia",
  "Música",
  "Arte 3D",
  "Colecionáveis",
  "Generativa",
  "Jogos",
  "Assinaturas",
  "Utilidade",
];
const names = [
  "Emerald Ape #042",
  "Sage Nomad #009",
  "Neon Vessel #552",
  "Cosmic Bloom #118",
  "Violet Nomad #314",
  "Ivory Baron #088",
  "Golden Beat #207",
  "Golden Echo #091",
  "Golden Signal #160",
];
const prices = [
  "1.19",
  "1.69",
  "1.99",
  "1.29",
  "1.39",
  "1.79",
  "0.99",
  "0.79",
  "0.39",
];
const images = [
  "8f387.png",
  "83794.png",
  "9add2.png",
  "83794.png",
  "83794.png",
  "9add2.png",
  "b7cfc.png",
  "b7cfc.png",
  "b7cfc.png",
];
export const nfts: Nft[] = Array.from({ length: 36 }, (_, i) => ({
  id: String(i + 1),
  name:
    i < 9
      ? names[i]
      : `${names[i % 9].split(" #")[0]} #${String(200 + i).padStart(3, "0")}`,
  token: String(
    i < 9 ? [42, 9, 552, 118, 314, 88, 207, 91, 160][i] : 200 + i,
  ).padStart(4, "0"),
  price: prices[i % 9],
  previousPrice: i === 2 ? "2.29" : undefined,
  image: `/assets/${images[i % 9]}`,
  category: categories[i % categories.length],
  network:
    i < 9 ? "Ethereum" : (["Ethereum", "Polygon", "Solana"] as const)[i % 3],
  stock: 20,
  version: 1,
  editions: [
    { id: "1/1", stock: 1 },
    { id: "1/10", stock: 10 },
    { id: "1/50", stock: 20 },
    { id: "ABERTA", stock: 0 },
  ],
  created: 100 - i,
  popularity: (i * 17) % 100,
}));
export const users: User[] = [
  {
    id: "u1",
    name: "Nova Sato",
    username: "nova",
    email: "nova@kurio.test",
    ens: "nova",
    walletNickname: "Principal",
    avatar: "",
  },
  {
    id: "u2",
    name: "Breno Menezes",
    username: "breno",
    email: "breno@kurio.test",
    ens: "breno",
    walletNickname: "Principal",
    avatar: "",
  },
];
export const wallets: Wallet[] = [
  {
    id: "w1",
    label: "Principal",
    address: "0xA91F00000000000000000000000000000000E82C",
    network: "Ethereum",
    provider: "MetaMask",
    primary: true,
  },
  {
    id: "w2",
    label: "Reserva",
    address: "nova.kurio.eth",
    network: "Polygon",
    provider: "Coinbase Wallet",
    primary: false,
  },
];
