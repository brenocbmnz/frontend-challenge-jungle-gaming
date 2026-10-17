import { ws } from "msw";
import { toSocketIo } from "@mswjs/socket.io-binding";
import type { NftEvent, OrderEvent } from "../api/contracts";
import { db, save } from "./database";
const channel = ws.link("wss://realtime.kurio.test/");
type Peer = {
  emit: (event: string, payload: unknown) => void;
  close: () => void;
  userId?: string;
};
const peers = new Set<Peer>();
export const socketHandler = channel.addEventListener(
  "connection",
  (connection) => {
    const io = toSocketIo(connection);
    const peer: Peer = {
      emit: (event, payload) => io.client.emit(event, payload),
      close: () => connection.client.close(1012, "Simulação de reconexão"),
    };
    peers.add(peer);
    io.client.on("session", (_event, token: string) => {
      const session = db.sessions[token];
      peer.userId =
        session && session.expiresAt > Date.now() ? session.userId : undefined;
    });
    connection.client.addEventListener("message", (event) => {
      if (event.data === "2") connection.client.send("3");
    });
    const heartbeat = setInterval(() => {
      try {
        connection.client.send("2");
      } catch {
        clearInterval(heartbeat);
      }
    }, 20000);
    connection.client.addEventListener("close", () => {
      clearInterval(heartbeat);
      peers.delete(peer);
    });
  },
);
export function nftUpdated(event: NftEvent) {
  for (const p of peers) p.emit("nft.updated", event);
}
export function orderUpdated(event: OrderEvent) {
  for (const p of peers)
    if (p.userId === event.userId) p.emit("order.updated", event);
}
export function disconnect() {
  for (const p of peers) p.close();
}
export function changeNft(id = "1", soldOut = false) {
  const n = db.nfts.find((n) => n.id === id);
  if (!n) return;
  n.version++;
  if (soldOut) {
    n.stock = 0;
  } else {
    const [a, b = "00"] = n.price.split(".");
    n.price = `${Number(a) + 1}.${b}`;
  }
  save();
  const event = {
    id: `nft-${id}-${n.version}`,
    resourceId: id,
    version: n.version,
    nft: structuredClone(n),
  };
  nftUpdated(event);
  return event;
}
