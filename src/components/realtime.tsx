import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import type {
  Catalog,
  Nft,
  NftEvent,
  Order,
  OrderEvent,
} from "../api/contracts";
import { token } from "../api/client";
import { queryClient } from "../api/queries";
import { useSession } from "./session";
export function Realtime() {
  const { uid } = useSession();
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(true);
  useEffect(() => {
    let active = true;
    let connection: Socket | undefined;
    void import("socket.io-client")
      .then(({ io }) => {
        if (!active) return;
        const seen = new Map<string, number>();
        const socket = io("wss://realtime.kurio.test", {
          transports: ["websocket"],
          reconnectionDelay: 300,
          reconnectionDelayMax: 1500,
        });
        connection = socket;
        let hasConnected = false;
        const reconcile = () => {
          if (!active) return;
          setConnected(true);
          socket.emit("session", token());
          if (!hasConnected) {
            hasConnected = true;
            return;
          }
          for (const key of ["catalog", "nft", "cart", "quote", "order"])
            void queryClient.invalidateQueries({ queryKey: [key] });
        };
        socket.on("connect", reconcile);
        socket.on("disconnect", () => {
          if (active) setConnected(false);
        });
        socket.on("nft.updated", (e: NftEvent) => {
          if (!active) return;
          const key = `nft:${e.resourceId}`;
          const current = queryClient.getQueryData<Nft>(["nft", e.resourceId]);
          if (e.version <= (seen.get(key) || current?.version || 0)) return;
          seen.set(key, e.version);
          queryClient.setQueryData<Nft>(["nft", e.resourceId], (old) =>
            !old || old.version < e.version ? e.nft : old,
          );
          queryClient.setQueriesData<Catalog>(
            { queryKey: ["catalog"] },
            (old) =>
              old
                ? {
                    ...old,
                    items: old.items.map((n) =>
                      n.id === e.resourceId && n.version < e.version
                        ? e.nft
                        : n,
                    ),
                  }
                : old,
          );
          void queryClient.invalidateQueries({ queryKey: ["catalog"] });
          void queryClient.invalidateQueries({ queryKey: ["quote", uid] });
          void queryClient.invalidateQueries({ queryKey: ["cart", uid] });
          setMessage(
            "Preço ou disponibilidade atualizado. Revise seu carrinho antes de comprar.",
          );
        });
        socket.on("order.updated", (e: OrderEvent) => {
          if (!active || e.userId !== uid) return;
          const key = `order:${e.resourceId}`;
          const cached = queryClient.getQueryData<Order>([
            "order",
            uid,
            e.resourceId,
          ]);
          if (
            e.version <= Math.max(seen.get(key) || 0, cached?.version || 0) ||
            (cached && cached.status !== "pending")
          )
            return;
          seen.set(key, e.version);
          queryClient.setQueryData(["order", uid, e.resourceId], e.order);
          void queryClient.invalidateQueries({ queryKey: ["cart", uid] });
          void queryClient.invalidateQueries({ queryKey: ["quote", uid] });
          setMessage(
            e.order.status === "confirmed"
              ? "Pedido confirmado. Seu recibo está disponível."
              : "O pedido foi recusado. Seus itens foram preservados.",
          );
        });
      })
      .catch(() => {
        if (active) setConnected(false);
      });
    return () => {
      active = false;
      connection?.removeAllListeners();
      connection?.disconnect();
    };
  }, [uid]);
  return (
    <>
      {!connected && (
        <div className="connection-banner" role="status">
          Reconectando… Seus dados serão sincronizados com a API.
        </div>
      )}
      {message && (
        <div className="toast" role="status">
          {message}
          <button aria-label="Fechar aviso" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
    </>
  );
}
