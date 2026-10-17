import { Artwork } from "../components/artwork";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Heart, Star, ZoomIn, ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import type { Cart, Edition } from "../api/contracts";
import { api } from "../api/client";
import {
  cartQuery,
  favoritesQuery,
  nftQuery,
  queryClient,
} from "../api/queries";
import { useSession } from "../components/session";
import { Breadcrumb, Page } from "../components/layout";
import { Empty, ErrorBox, Quantity, Skeleton } from "../components/common";
import { Dialog } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { eth } from "../lib/money";
import { Related } from "./home";
export function Detail() {
  const { id } = useParams({ strict: false });
  const { uid, user } = useSession();
  const navigate = useNavigate();
  const q = useQuery(nftQuery(id || ""));
  const favorites = useQuery(favoritesQuery(uid));
  const cart = useQuery(cartQuery(uid));
  const [edition, setEdition] = useState<Edition>("1/50");
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [tab, setTab] = useState("details");
  const [added, setAdded] = useState(false);
  const add = useMutation({
    mutationFn: async () => {
      const existing =
        cart.data?.items.find((i) => i.nftId === id && i.edition === edition)
          ?.quantity || 0;
      return (
        await api.put<Cart>("/cart", {
          nftId: id,
          edition,
          quantity: existing + quantity,
        })
      ).data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart", uid] });
      void queryClient.invalidateQueries({ queryKey: ["quote", uid] });
      setAdded(true);
    },
  });
  const favorite = useMutation({
    mutationFn: async () => {
      return (
        await api.put<string[]>(`/favorites/${id}`, {
          favorite: !favorites.data?.includes(id || ""),
        })
      ).data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["favorites", uid] });
      const previous = queryClient.getQueryData<string[]>(["favorites", uid]);
      queryClient.setQueryData<string[]>(["favorites", uid], (old) =>
        old?.includes(id!)
          ? old.filter((n) => n !== id)
          : [...(old || []), id!],
      );
      return { previous };
    },
    onError: (_e, _v, context) =>
      queryClient.setQueryData(["favorites", uid], context?.previous),
    onSuccess: (data) => queryClient.setQueryData(["favorites", uid], data),
  });
  if (q.isPending)
    return (
      <Page>
        <div
          className="detail-loading"
          role="status"
          aria-label="Carregando conteúdo"
        >
          <div className="skeleton detail-loading-breadcrumb" />
          <div className="detail-loading-product">
            <div className="skeleton detail-loading-hero" />
            <div className="detail-loading-info">
              <div className="skeleton h-8 w-3/4" />
              <div className="skeleton h-20 mt-5" />
              <div className="skeleton h-8 mt-5 w-1/2" />
            </div>
          </div>
          <div className="detail-loading-description">
            <div className="skeleton h-6 w-1/2" />
            <div className="skeleton h-40 mt-5" />
          </div>
          <div className="detail-loading-related">
            <Skeleton cards={5} />
          </div>
        </div>
      </Page>
    );
  if (q.isError)
    return (
      <Page>
        <ErrorBox error={q.error} retry={() => void q.refetch()} />
      </Page>
    );
  const n = q.data;
  const max = Math.min(
    n.stock,
    n.editions.find((e) => e.id === edition)?.stock || 0,
  );
  const isFavorite = favorites.data?.includes(n.id);
  return (
    <Page>
      <Breadcrumb>{n.name}</Breadcrumb>
      <section className="product">
        <div className="product-gallery">
          <div className="product-thumbs">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                onClick={() => setZoom(true)}
                aria-label={`Ampliar imagem ${i + 1} de ${n.name}`}
              >
                <Artwork src={n.image} alt="" width="100" height="100" />
              </button>
            ))}
          </div>
          <div className="product-main-image">
            <div className="mobile-product-actions">
              <Link to="/" aria-label="Voltar">
                <ArrowLeft size={20} />
              </Link>
              <button
                aria-label={isFavorite ? "Remover favorito" : "Favoritar"}
                disabled={favorite.isPending}
                aria-pressed={!!isFavorite}
                onClick={() =>
                  user
                    ? favorite.mutate()
                    : void navigate({
                        to: "/login",
                        search: { redirect: location.pathname },
                      })
                }
              >
                <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            </div>
            <Artwork
              src={n.image}
              alt={n.name}
              width="412"
              height="412"
              fetchPriority="high"
              loading="eager"
              sizes="(max-width:768px) calc(100vw - 56px), 412px"
            />
            <button
              className="zoom-button"
              aria-label="Ampliar imagem"
              onClick={() => setZoom(true)}
            >
              <ZoomIn size={24} />
            </button>
          </div>
        </div>
        <div className="product-info">
          <h1>{n.name}</h1>
          <div className="product-price">
            <strong>{eth(n.price)}</strong>
            <span>
              <Star size={14} fill="currentColor" />{" "}
              <span className="desktop-rating">
                ★★★★ 19 avaliações de colecionadores
              </span>
              <span className="mobile-rating">4.8 (19)</span>
            </span>
          </div>
          <h2>Sobre este NFT:</h2>
          <p className="product-description">
            <span className="desktop-only">
              Um colecionável digital finalizado à mão da coleção Kurio
              Editions, verificado na {n.network}, com arte desbloqueável e
              acesso para colecionadores.
            </span>
            <span className="mobile-only">
              Um colecionável digital 1/50 finalizado à mão da coleção Kurio
              Editions, verificado na {n.network}.
            </span>
          </p>
          <fieldset className="edition-selector">
            <legend>Edição:</legend>
            {n.editions.map((e) => (
              <button
                type="button"
                key={e.id}
                disabled={!e.stock || !n.stock}
                aria-pressed={edition === e.id}
                onClick={() => {
                  setEdition(e.id);
                  setQuantity(1);
                  setAdded(false);
                }}
              >
                {e.id}
              </button>
            ))}
          </fieldset>
          <div className="product-purchase">
            <span className="mobile-only quantity-label">Qtd.</span>
            <strong className="mobile-only mobile-buy-price">
              {eth(n.price)}
            </strong>
            <Quantity
              value={quantity}
              max={max}
              onChange={(v) => {
                setQuantity(v);
                setAdded(false);
              }}
            />
            <Button
              disabled={!max || add.isPending || quantity > max}
              onClick={() => add.mutate()}
            >
              {added ? (
                <>
                  <Check size={18} />
                  ADICIONADO
                </>
              ) : !max ? (
                "ESGOTADO"
              ) : add.isPending ? (
                "ADICIONANDO…"
              ) : (
                <>
                  <span className="desktop-only">COMPRAR</span>
                  <span className="mobile-only">Comprar NFT</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="favorite-button"
              disabled={favorite.isPending}
              onClick={() =>
                user
                  ? favorite.mutate()
                  : void navigate({
                      to: "/login",
                      search: { redirect: location.pathname },
                    })
              }
              aria-pressed={!!isFavorite}
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
              {isFavorite ? "Favoritado" : "Favoritar"}
            </Button>
            <Link
              className="mobile-only mobile-cart-link"
              to="/carrinho"
              aria-label="Ver carrinho"
            >
              <img src="/assets/3c537.svg" alt="" />
            </Link>
          </div>
          {add.isError && <ErrorBox error={add.error} />}{" "}
          {favorite.isError && <ErrorBox error={favorite.error} />}{" "}
          {added && (
            <p role="status" className="text-accent">
              <Link to="/carrinho">Item adicionado. Ver carrinho →</Link>
            </p>
          )}
          <div className="token-meta">
            <p>ID do token: #{n.token}</p>
            <p>Coleção: Kurio Apes</p>
            <p>Atributos: Óculos, Esmeralda, Raro</p>
          </div>
          <p className="share">
            Compartilhar este NFT:{" "}
            <button
              onClick={() => void navigator.clipboard?.writeText(location.href)}
            >
              Copiar link
            </button>
          </p>
        </div>
      </section>
      <section className="product-description-section">
        <div className="section-tabs">
          <button
            className={tab === "details" ? "active" : ""}
            onClick={() => setTab("details")}
          >
            Detalhes do NFT
          </button>
          <button
            className={tab === "reviews" ? "active" : ""}
            onClick={() => setTab("reviews")}
          >
            Avaliações de colecionadores (19)
          </button>
        </div>
        {tab === "details" ? (
          <div>
            <p>
              {n.name} é uma obra digital 1/50 finalizada à mão da coleção Kurio
              Editions. Cada atributo fica armazenado nos metadados do token e
              verificado na {n.network}. A obra explora identidade, movimento e
              luz em um mundo digital sem fronteiras.
            </p>
            <p>
              A propriedade inclui a arte em alta resolução, lançamentos
              exclusivos para colecionadores e um registro permanente de
              procedência registrada na rede. Nova Sato recebe 5% de direitos
              autorais nas vendas secundárias, apoiando novos trabalhos e
              lançamentos da comunidade.
            </p>
            <dl>
              <dt>Rede:</dt>
              <dd>
                Cunhado na {n.network} com procedência imutável e metadados
                armazenados no IPFS.
              </dd>
              <dt>Contrato:</dt>
              <dd>0x7A42...19E8 • Contrato inteligente ERC-721 verificado.</dd>
              <dt>Direitos autorais:</dt>
              <dd>Direitos autorais do criador: 5% nas vendas secundárias.</dd>
            </dl>
          </div>
        ) : (
          <Empty title="Avaliações de colecionadores">
            <p>
              A publicação de avaliações está fora do escopo desta demonstração.
            </p>
          </Empty>
        )}
      </section>
      <Related />
      <Dialog
        open={zoom}
        onOpenChange={setZoom}
        title={n.name}
        description="Visualização ampliada da obra"
      >
        <Artwork src={n.image} alt={n.name} className="zoom-art" />
      </Dialog>
    </Page>
  );
}
