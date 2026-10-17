import { Artwork } from "../components/artwork";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { XCircle } from "lucide-react";
import axios from "axios";
import type { Collector, Order, Quote, User, Wallet } from "../api/contracts";
import { api, errorData, get } from "../api/client";
import {
  orderQuery,
  queryClient,
  quoteQuery,
  walletsQuery,
} from "../api/queries";
import { useSession } from "../components/session";
import { Breadcrumb, MobileTitle, Page } from "../components/layout";
import { Empty, ErrorBox, Field, Skeleton } from "../components/common";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { eth } from "../lib/money";
import { validateCollector } from "../lib/collector";
import { Coupon, Totals } from "./cart";
interface Attempt {
  key: string;
  body: {
    quoteId: string;
    walletId: string;
    note: string;
    collector: Collector;
  };
}
export function Checkout() {
  const { user, uid } = useSession();
  const q = useQuery(quoteQuery(uid));
  const wallets = useQuery(walletsQuery(uid));
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const [chooseWallet, setChooseWallet] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [provider, setProvider] = useState("");
  const [connected, setConnected] = useState("");
  const [review, setReview] = useState<Quote>();
  const [note, setNote] = useState("");
  const [showCollector, setShowCollector] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [collector, setCollector] = useState<Collector>({
    name: user?.name || "",
    email: user?.email || "",
    username: user?.username || "",
    profileName: user?.name || "",
    ens: user?.ens || "",
    secondaryWallet: "",
    referralCode: "",
    walletNickname: user?.walletNickname || "",
  });
  const [formError, setFormError] = useState("");
  const busy = useRef(false);
  const storageKey = `kurio.attempt.${uid}`;
  const [pendingAttempt, setPendingAttempt] = useState<Attempt | undefined>(
    () => {
      try {
        return (
          JSON.parse(sessionStorage.getItem(storageKey) || "null") || undefined
        );
      } catch {
        return undefined;
      }
    },
  );
  const activeWallet = wallets.data?.find(
    (w) =>
      w.id ===
      (selected ||
        wallets.data?.find((w) => w.primary)?.id ||
        wallets.data?.[0]?.id),
  );
  const selectedProvider = provider || activeWallet?.provider || "MetaMask";
  const connectionKey = activeWallet
    ? `${activeWallet.id}:${activeWallet.network}:${selectedProvider}`
    : "";
  function validateDetails() {
    const errors = validateCollector(collector, note);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setShowCollector(true);
      requestAnimationFrame(() => {
        const invalid = Array.from(
          document.querySelectorAll<HTMLElement>('[aria-invalid="true"]'),
        ).find((el) => el.getClientRects().length);
        invalid?.focus();
      });
      throw new Error("Revise os dados destacados do colecionador.");
    }
  }
  function selectNetwork(network: string) {
    const wallet =
      wallets.data?.find(
        (w) => w.network === network && w.id === activeWallet?.id,
      ) || wallets.data?.find((w) => w.network === network);
    if (!wallet) return;
    setSelected(wallet.id);
    setProvider("");
    setConnected("");
    setReview(undefined);
  }
  const networkOptions = [
    ...new Set(wallets.data?.map((w) => w.network) || []),
  ];
  const connect = useMutation({
    mutationFn: async () => {
      if (!activeWallet)
        throw new Error("Cadastre uma carteira para continuar.");
      await api.post("/wallets/connect", {
        walletId: activeWallet.id,
        network: activeWallet.network,
        provider: selectedProvider,
      });
      return connectionKey;
    },
    onSuccess: (key) => setConnected(key),
  });
  const reviewMutation = useMutation({
    mutationFn: async () => {
      validateDetails();
      if (!activeWallet || connected !== connectionKey)
        throw new Error("Conecte a carteira selecionada antes de continuar.");
      const data = (await api.post<Quote>("/quote")).data;
      queryClient.setQueryData(["quote", uid], data);
      if (!data.valid)
        throw new Error(data.issues.join(". ") || "Seu carrinho está vazio.");
      return data;
    },
    onSuccess: (data) => setReview(data),
  });
  const submit = useMutation({
    mutationFn: async (recovery: boolean) => {
      if (busy.current) throw new Error("Pedido em processamento.");
      busy.current = true;
      try {
        let attempt = pendingAttempt;
        if (!attempt) {
          validateDetails();
          if (!review || !activeWallet)
            throw new Error("Revise a compra antes de confirmar.");
          const current = (await api.post<Quote>("/quote")).data;
          queryClient.setQueryData(["quote", uid], current);
          if (current.id !== review.id) {
            setReview(undefined);
            throw new Error(
              "A cotação mudou. Revise os novos valores e confirme novamente.",
            );
          }
          attempt = {
            key: crypto.randomUUID(),
            body: {
              quoteId: review.id,
              walletId: activeWallet.id,
              note,
              collector,
            },
          };
          sessionStorage.setItem(storageKey, JSON.stringify(attempt));
          setPendingAttempt(attempt);
        }
        if (recovery) {
          try {
            return await get<Order>(`/orders/by-key/${attempt.key}`);
          } catch (e) {
            if (errorData(e).message !== "Pedido não encontrado.") throw e;
          }
        }
        return (
          await api.post<Order>("/orders", attempt.body, {
            headers: { "Idempotency-Key": attempt.key },
          })
        ).data;
      } finally {
        busy.current = false;
      }
    },
    onSuccess: async (order) => {
      sessionStorage.removeItem(storageKey);
      setPendingAttempt(undefined);
      setReview(undefined);
      queryClient.setQueryData(["order", uid, order.id], order);
      await navigate({ to: "/pedido/$id", params: { id: order.id } });
    },
    onError: (error) => {
      if (
        (axios.isAxiosError(error) &&
          error.response &&
          error.response.status >= 400 &&
          error.response.status < 500 &&
          error.response.status !== 401) ||
        errorData(error).code === "QUOTE_CHANGED"
      ) {
        sessionStorage.removeItem(storageKey);
        setPendingAttempt(undefined);
        setReview(undefined);
        void q.refetch();
      }
      const fields = errorData(error).fields;
      if (fields) setFieldErrors(fields);
      setFormError(errorData(error).message);
    },
  });
  if (q.isPending || wallets.isPending)
    return (
      <Page>
        <Skeleton cards={2} />
      </Page>
    );
  if (q.isError)
    return (
      <Page>
        <ErrorBox error={q.error} retry={() => void q.refetch()} />
      </Page>
    );
  if (wallets.isError)
    return (
      <Page>
        <ErrorBox error={wallets.error} retry={() => void wallets.refetch()} />
      </Page>
    );
  if (!q.data?.lines.length && !pendingAttempt)
    return (
      <Page>
        <Empty title="Seu carrinho está vazio">
          <Button asChild>
            <Link to="/">Explorar NFTs</Link>
          </Button>
        </Empty>
      </Page>
    );
  const changed = !!review && q.data?.id !== review.id;
  return (
    <Page>
      <Breadcrumb>Pagamento</Breadcrumb>
      <MobileTitle title="Pagamento com carteira" back="/carrinho" />
      <div className="checkout-layout">
        <section
          id="collector-details"
          className={`collector-form ${showCollector ? "is-expanded" : ""}`}
        >
          <h1>Perfil do colecionador</h1>
          <div className="profile-grid">
            <Field
              label="Nome de exibição"
              error={fieldErrors.name}
              value={collector.name}
              onChange={(e) =>
                setCollector({ ...collector, name: e.target.value })
              }
              required
            />
            <Field
              label="Nome de usuário"
              error={fieldErrors.username}
              value={collector.username}
              onChange={(e) =>
                setCollector({ ...collector, username: e.target.value })
              }
              required
            />
            <Field
              label="E-mail"
              type="email"
              error={fieldErrors.email}
              value={collector.email}
              onChange={(e) =>
                setCollector({ ...collector, email: e.target.value })
              }
              required
            />
            <Field
              label="Nome ENS"
              error={fieldErrors.ens}
              value={collector.ens}
              onChange={(e) =>
                setCollector({ ...collector, ens: e.target.value })
              }
              placeholder=".eth"
            />
            <Field
              label="Endereço da carteira"
              value={activeWallet?.address || ""}
              readOnly
            />
            <div className="field network-choice">
              <label htmlFor="checkout-network">Rede</label>
              <div className="input-wrap">
                <select
                  id="checkout-network"
                  value={activeWallet?.network || ""}
                  onChange={(e) => selectNetwork(e.target.value)}
                  disabled={!networkOptions.length}
                >
                  {networkOptions.map((network) => (
                    <option key={network}>{network}</option>
                  ))}
                </select>
              </div>
            </div>
            <Field
              label="Nome do perfil"
              error={fieldErrors.profileName}
              value={collector.profileName}
              onChange={(e) =>
                setCollector({ ...collector, profileName: e.target.value })
              }
            />
            <Field
              label="ENS ou carteira secundária (opcional)"
              placeholder="ENS ou carteira secundária (opcional)"
              error={fieldErrors.secondaryWallet}
              value={collector.secondaryWallet}
              onChange={(e) =>
                setCollector({ ...collector, secondaryWallet: e.target.value })
              }
            />
            <Field
              label="Código de indicação"
              error={fieldErrors.referralCode}
              value={collector.referralCode}
              onChange={(e) =>
                setCollector({ ...collector, referralCode: e.target.value })
              }
            />
            <Field label="Tipo de carteira" value={selectedProvider} readOnly />
          </div>
          <button
            className="checkout-wallet-toggle desktop-only"
            onClick={() => setChooseWallet(!chooseWallet)}
            aria-expanded={chooseWallet}
          >
            Usar outra carteira?
          </button>
          <label className="note-field">
            Observação do colecionador (opcional)
            <textarea
              aria-invalid={!!fieldErrors.note}
              aria-describedby={
                fieldErrors.note ? "checkout-note-error" : undefined
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
            {fieldErrors.note && (
              <span id="checkout-note-error" className="field-error">
                {fieldErrors.note}
              </span>
            )}
          </label>
        </section>
        <section className="checkout-summary">
          <h2 className="desktop-only">Seus NFTs</h2>
          <div className="checkout-line-head desktop-only">
            <span>NFTs</span>
            <span>Subtotal</span>
          </div>
          <div className="checkout-lines desktop-only">
            {q.data?.lines.map((l) => (
              <div key={l.nftId + l.edition}>
                <Artwork src={l.image} alt="" width="70" height="70" />
                <span>
                  {l.name}
                  <small>
                    ID do token: #{l.token || l.nftId.padStart(4, "0")}{" "}
                    <em>(× {l.quantity})</em>
                  </small>
                </span>
                <strong>{eth(l.subtotal)}</strong>
              </div>
            ))}
          </div>
          <div className="desktop-only">
            {q.data && (
              <>
                <button
                  className="checkout-coupon-toggle"
                  onClick={() => setShowCoupon(!showCoupon)}
                >
                  Tem um código promocional? Aplique aqui
                </button>
                {showCoupon && <Coupon current={q.data.coupon} />}
                <Totals quote={q.data} />
              </>
            )}
          </div>
          <div className="wallet-heading">
            <h2>
              Carteira{" "}
              {connected === connectionKey && !!connectionKey
                ? "conectada"
                : "selecionada"}
            </h2>
            <Link to="/carteiras">Trocar carteira</Link>
          </div>
          <div
            className={`checkout-wallets ${chooseWallet ? "is-expanded" : ""}`}
          >
            {wallets.data?.map((w) => (
              <label className="checkout-wallet" key={w.id}>
                <input
                  type="radio"
                  name="wallet"
                  checked={activeWallet?.id === w.id}
                  onChange={() => {
                    setSelected(w.id);
                    setConnected("");
                    setReview(undefined);
                  }}
                />
                <div>
                  <b>{w.label}</b>
                  <p>
                    {w.address.length > 24
                      ? w.address.slice(0, 6) + "…" + w.address.slice(-4)
                      : w.address}
                  </p>
                  <p>Rede {w.network}</p>
                </div>
              </label>
            ))}
          </div>
          {!wallets.data?.length && (
            <Empty title="Cadastre sua carteira">
              <Button asChild>
                <Link to="/carteiras">Adicionar carteira</Link>
              </Button>
            </Empty>
          )}
          <label className="mobile-only network-choice">
            Rede
            <select
              aria-label="Rede do pagamento"
              value={activeWallet?.network || ""}
              onChange={(e) => selectNetwork(e.target.value)}
              disabled={!networkOptions.length}
            >
              {networkOptions.map((network) => (
                <option key={network}>{network}</option>
              ))}
            </select>
          </label>
          <button
            className="collector-toggle mobile-only"
            aria-controls="collector-details"
            aria-expanded={showCollector}
            onClick={() => setShowCollector(!showCollector)}
          >
            Dados do colecionador {showCollector ? "−" : "+"}
          </button>
          <h2 className="mt-4">Carteira e rede</h2>
          <div className="provider-options">
            {["WalletConnect", "MetaMask", "Coinbase Wallet"].map((p, i) => (
              <label key={p}>
                <span className="provider-icon">
                  {i === 2 ? <img src="/assets/75870.svg" alt="" /> : p[0]}
                </span>
                <span>{p}</span>
                <input
                  type="radio"
                  name="provider"
                  checked={selectedProvider === p}
                  onChange={() => {
                    setProvider(p);
                    setConnected("");
                    setReview(undefined);
                  }}
                />
              </label>
            ))}
          </div>
          {!!connectionKey && connected === connectionKey ? (
            <button
              className="disconnect-wallet"
              onClick={async () => {
                try {
                  await api.post("/wallets/disconnect");
                  setConnected("");
                  setReview(undefined);
                } catch (error) {
                  setFormError(errorData(error).message);
                }
              }}
            >
              Desconectar carteira
            </button>
          ) : (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => connect.mutate()}
              disabled={connect.isPending || !activeWallet}
            >
              {connect.isPending ? "Conectando…" : "Conectar carteira"}
            </Button>
          )}
          {connect.isError && <ErrorBox error={connect.error} />}
          <p className="mobile-checkout-total mobile-only">
            Total: <strong>{eth(q.data?.total || "0")}</strong>
          </p>
          {reviewMutation.isError && <ErrorBox error={reviewMutation.error} />}{" "}
          {formError && (
            <div className="error-box" role="alert">
              {formError}
            </div>
          )}
          {pendingAttempt ? (
            <div className="recovery-box">
              <p>
                Existe uma tentativa de compra em andamento. Recupere o mesmo
                pedido para evitar duplicação.
              </p>
              <Button
                onClick={() => submit.mutate(true)}
                disabled={submit.isPending}
              >
                Recuperar pedido
              </Button>
            </div>
          ) : (
            <Button
              className="confirm-purchase"
              onClick={() => {
                setFormError("");
                reviewMutation.mutate();
              }}
              disabled={reviewMutation.isPending || !q.data?.valid}
            >
              Revisar compra
            </Button>
          )}
        </section>
      </div>
      <Dialog
        open={!!review}
        onOpenChange={(open) => {
          if (!open && !submit.isPending) setReview(undefined);
        }}
        title="Revise sua compra"
        description="Confira os itens, a carteira e o valor antes de enviar o pedido."
      >
        {review && (
          <>
            <div className="mobile-only review-collector">
              <Field
                label="Nome de exibição"
                error={fieldErrors.name}
                value={collector.name}
                onChange={(e) =>
                  setCollector({ ...collector, name: e.target.value })
                }
                required
              />
              <Field
                label="E-mail"
                type="email"
                error={fieldErrors.email}
                value={collector.email}
                onChange={(e) =>
                  setCollector({ ...collector, email: e.target.value })
                }
                required
              />
              <Field
                label="Nome de usuário"
                error={fieldErrors.username}
                value={collector.username}
                onChange={(e) =>
                  setCollector({ ...collector, username: e.target.value })
                }
                required
              />
            </div>
            <div className="review-items">
              {review.lines.map((l) => (
                <p key={l.nftId + l.edition}>
                  {l.name} × {l.quantity} <strong>{eth(l.subtotal)}</strong>
                </p>
              ))}
            </div>
            <p className="text-sm my-4">
              {activeWallet?.label} · {activeWallet?.network} ·{" "}
              {selectedProvider}
            </p>
            <Totals quote={q.data || review} />
            {changed && (
              <p role="alert" className="error-box">
                Preço ou disponibilidade alterado. Feche esta revisão e revise a
                compra novamente.
              </p>
            )}
            {submit.isError && <ErrorBox error={submit.error} />}
            <Button
              className="w-full mt-5"
              disabled={changed || submit.isPending}
              onClick={() => submit.mutate(false)}
            >
              {submit.isPending ? "Enviando pedido…" : "Confirmar compra"}
            </Button>
          </>
        )}
      </Dialog>
    </Page>
  );
}
export function OrderPage() {
  const { id } = useParams({ strict: false });
  const { uid } = useSession();
  const q = useQuery(orderQuery(id || "", uid));
  if (q.isPending)
    return (
      <Page>
        <Skeleton cards={2} />
      </Page>
    );
  if (q.isError)
    return (
      <Page>
        <ErrorBox error={q.error} retry={() => void q.refetch()} />
      </Page>
    );
  const order = q.data;
  if (order.status === "pending")
    return (
      <Page>
        <div className="order-status">
          <div className="skeleton status-orb" />
          <h1>Pedido em processamento</h1>
          <p>Estamos aguardando a confirmação do pagamento simulado.</p>
          <p>
            Pedido {order.id}. Você pode recarregar esta página com segurança.
          </p>
          <Button variant="outline" onClick={() => void q.refetch()}>
            Consultar pedido
          </Button>
        </div>
      </Page>
    );
  if (order.status === "refused")
    return (
      <Page>
        <div className="order-status">
          <XCircle size={64} />
          <h1>Pagamento recusado</h1>
          <p>Seus itens foram preservados no carrinho.</p>
          <Button asChild>
            <Link to="/carrinho">Voltar ao carrinho</Link>
          </Button>
        </div>
      </Page>
    );
  return (
    <main id="main-content" tabIndex={-1} className="receipt-page">
      <Receipt order={order} />
    </main>
  );
}
function Receipt({ order }: { order: Order }) {
  return (
    <section className="receipt">
      <div className="receipt-heading">
        <img src="/assets/21283.svg" alt="" />
        <h1>Seus NFTs agora estão na sua carteira</h1>
      </div>
      <dl className="receipt-meta">
        <div>
          <dt>ID da transação</dt>
          <dd>
            {order.transaction.slice(0, 8)}…{order.transaction.slice(-4)}
          </dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>
            {new Date(order.createdAt).toLocaleDateString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })}
          </dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{eth(order.quote.total)}</dd>
        </div>
        <div>
          <dt>Carteira</dt>
          <dd>{order.wallet.provider}</dd>
        </div>
      </dl>
      <div className="receipt-body">
        <h2>Detalhes da transação</h2>
        {order.quote.lines.map((l) => (
          <article key={l.nftId + l.edition}>
            <Artwork src={l.image} alt="" width="70" height="70" />
            <div>
              <h3>{l.name}</h3>
              <p>
                Edição: {l.edition} (× {l.quantity})
              </p>
            </div>
            <strong>{eth(l.subtotal)}</strong>
          </article>
        ))}
        <Totals quote={order.quote} />
        <p className="receipt-disclaimer">
          Transação simulada na {order.wallet.network}. Este recibo preserva os
          itens e valores confirmados no pedido.
        </p>
        <Button asChild>
          <Link to="/">Continuar explorando</Link>
        </Button>
        <details>
          <summary>Referência da transação simulada</summary>
          <p>Pedido {order.id}</p>
          <p className="break-all">{order.transaction}</p>
          <p>Não existe registro real em exploradores de blockchain.</p>
        </details>
      </div>
    </section>
  );
}
export type CheckoutWallet = Wallet;
export type CheckoutUser = User;
