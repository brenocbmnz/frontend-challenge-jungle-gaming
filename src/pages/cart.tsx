import { Artwork } from "../components/artwork";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { CartItem, Quote } from "../api/contracts";
import { api } from "../api/client";
import { cartQuery, queryClient, quoteQuery } from "../api/queries";
import { useSession } from "../components/session";
import { Breadcrumb, MobileTitle, Page } from "../components/layout";
import { Empty, ErrorBox, Quantity, Skeleton } from "../components/common";
import { Button } from "../components/ui/button";
import { eth } from "../lib/money";
import { Related } from "./home";
export function Totals({
  quote,
  children,
}: {
  quote: Quote;
  children?: ReactNode;
}) {
  return (
    <div className="totals">
      <p>
        <span>Subtotal</span>
        <span>{eth(quote.subtotal)}</span>
      </p>
      <p>
        <span>Desconto do lançamento</span>
        <span>(−) {eth(quote.discount)}</span>
      </p>
      <p>
        <span>Taxa de rede</span>
        <span>
          {eth(quote.fee)}
          <small>Taxa estimada</small>
        </span>
      </p>
      <p className="grand-total">
        <strong>Total</strong>
        <strong>{eth(quote.total)}</strong>
      </p>
      {children}
    </div>
  );
}
export function Coupon({ current }: { current: string }) {
  const { uid } = useSession();
  const [code, setCode] = useState(current);
  const mutation = useMutation({
    mutationFn: async () => (await api.post("/cart/coupon", { code })).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quote", uid] });
      void queryClient.invalidateQueries({ queryKey: ["cart", uid] });
    },
  });
  const remove = async () => {
    setCode("");
    await api.post("/cart/coupon", { code: "" });
    void queryClient.invalidateQueries({ queryKey: ["quote", uid] });
    void queryClient.invalidateQueries({ queryKey: ["cart", uid] });
  };
  return (
    <div className="coupon">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <label className="desktop-only" htmlFor="coupon">
          Código promocional
        </label>
        <div>
          <input
            id="coupon"
            aria-label="Código promocional"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Digite o código promocional..."
          />
          <Button type="submit" disabled={mutation.isPending}>
            Aplicar
          </Button>
        </div>
      </form>
      {mutation.isError && <ErrorBox error={mutation.error} />}{" "}
      {current && (
        <p role="status">
          {current} aplicado{" "}
          <button onClick={() => void remove()}>Remover cupom</button>
        </p>
      )}
    </div>
  );
}
export function CartPage() {
  const { uid } = useSession();
  const q = useQuery(quoteQuery(uid));
  const cart = useQuery(cartQuery(uid));
  const mutation = useMutation({
    mutationFn: async (item: CartItem) => {
      await api.put("/cart", item);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart", uid] });
      void queryClient.invalidateQueries({ queryKey: ["quote", uid] });
    },
  });
  return (
    <Page>
      <Breadcrumb>Carrinho</Breadcrumb>
      <MobileTitle title="Carrinho de NFTs" />
      {q.isPending || cart.isPending ? (
        <Skeleton cards={3} />
      ) : q.isError ? (
        <ErrorBox error={q.error} retry={() => void q.refetch()} />
      ) : !q.data?.lines.length ? (
        <Empty title="Seu carrinho está vazio">
          <p>Encontre sua próxima obra no catálogo.</p>
          <Button asChild>
            <Link to="/">Explorar NFTs</Link>
          </Button>
        </Empty>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Itens do carrinho">
            <div className="cart-table-head">
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
              <span />
            </div>
            {q.data.lines.map((line) => (
              <article
                className="cart-row"
                key={`${line.nftId}-${line.edition}`}
              >
                <Link
                  className="cart-item-name"
                  to="/nft/$id"
                  params={{ id: line.nftId }}
                >
                  <Artwork src={line.image} alt="" width="70" height="70" />
                  <div>
                    <h2>{line.name}</h2>
                    <p className="desktop-only">
                      ID do token: #{line.token || line.nftId.padStart(4, "0")}
                    </p>
                    <p className="mobile-only">Edição: {line.edition}</p>
                    <strong className="mobile-only">
                      {eth(line.subtotal)}
                    </strong>
                  </div>
                </Link>
                <span className="cart-unit-price">{eth(line.price)}</span>
                <Quantity
                  value={line.quantity}
                  max={line.stock}
                  disabled={mutation.isPending}
                  onChange={(quantity) =>
                    mutation.mutate({
                      nftId: line.nftId,
                      edition: line.edition,
                      quantity,
                    })
                  }
                />
                <strong className="cart-line-total">
                  {eth(line.subtotal)}
                </strong>
                <button
                  className="remove-item"
                  aria-label={`Remover ${line.name}`}
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({
                      nftId: line.nftId,
                      edition: line.edition,
                      quantity: 0,
                    })
                  }
                >
                  <Trash2 size={20} />
                </button>
              </article>
            ))}
            {q.data.issues.map((issue) => (
              <p role="alert" className="error-box" key={issue}>
                {issue}
              </p>
            ))}
            {mutation.isError && <ErrorBox error={mutation.error} />}
          </section>
          <aside className="cart-summary">
            <h1>Resumo da carteira</h1>
            <Coupon current={q.data.coupon} />
            <Totals quote={q.data}>
              <Button
                asChild
                className="checkout-link"
                disabled={!q.data.valid}
              >
                <Link to="/pagamento">Conectar e finalizar</Link>
              </Button>
              <Link to="/" className="continue-shopping">
                Continuar explorando
              </Link>
            </Totals>
          </aside>
        </div>
      )}
      <Related title="Colecionadores também viram" />
    </Page>
  );
}
