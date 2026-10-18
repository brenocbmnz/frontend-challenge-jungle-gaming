import { useMobile } from "../hooks/use-mobile";
import { Artwork } from "../components/artwork";
import {
  Link,
  useLocation,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronRight, Heart, Settings2, X } from "lucide-react";
import type { CatalogSearch, Nft } from "../api/contracts";
import {
  catalogQuery,
  defaultSearch,
  favoritesQuery,
  queryClient,
  validateSearch,
} from "../api/queries";
import { api } from "../api/client";
import { useSession } from "../components/session";
import { eth } from "../lib/money";
import { Page, BottomNav } from "../components/layout";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/dialog";
import { Empty, ErrorBox, Skeleton } from "../components/common";
const categories = [
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
export function NftCard({ nft, index = 0 }: { nft: Nft; index?: number }) {
  return (
    <article className={`nft-card nft-slot-${index % 9}`}>
      <Link to="/nft/$id" params={{ id: nft.id }}>
        <div className="nft-art">
          {nft.rarity === "rare" && (
            <span className="catalog-rarity">RARO</span>
          )}
          <Artwork
            src={nft.image}
            alt={nft.name}
            loading={index < 3 ? "eager" : "lazy"}
            fetchPriority={index === 2 ? "high" : undefined}
            width="250"
            height="250"
          />
        </div>
        <h3>{nft.name}</h3>
        <p className="nft-price">
          {eth(nft.price)}
          {nft.previousPrice && <del>{eth(nft.previousPrice)}</del>}
        </p>
        {!nft.stock && <span className="sold-label">Esgotado</span>}
      </Link>
      <CardFavorite nft={nft} />
    </article>
  );
}
function CardFavorite({ nft }: { nft: Nft }) {
  const { user, uid } = useSession();
  const navigate = useNavigate();
  const q = useQuery(favoritesQuery(uid));
  const selected = q.data?.includes(nft.id) || false;
  const mutation = useMutation({
    mutationFn: async () =>
      (await api.put<string[]>(`/favorites/${nft.id}`, { favorite: !selected }))
        .data,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["favorites", uid] });
      const previous = queryClient.getQueryData<string[]>(["favorites", uid]);
      queryClient.setQueryData<string[]>(["favorites", uid], (old) =>
        selected
          ? old?.filter((id) => id !== nft.id)
          : [...(old || []), nft.id],
      );
      return { previous };
    },
    onSuccess: (data) => queryClient.setQueryData(["favorites", uid], data),
    onError: (_error, _variables, context) =>
      queryClient.setQueryData(["favorites", uid], context?.previous),
  });
  return (
    <>
      <button
        className="catalog-favorite"
        aria-label={`${selected ? "Remover dos favoritos" : "Favoritar"} ${nft.name}`}
        aria-pressed={selected}
        disabled={mutation.isPending}
        onClick={() =>
          user
            ? mutation.mutate()
            : void navigate({ to: "/login", search: { redirect: "/" } })
        }
      >
        <Heart size={20} fill={selected ? "currentColor" : "none"} />
      </button>
      {mutation.isError && (
        <div className="catalog-favorite-error">
          <ErrorBox error={mutation.error} />
        </div>
      )}
    </>
  );
}
export function Related({ title = "Mais desta coleção" }: { title?: string }) {
  const q = useQuery(catalogQuery(defaultSearch));
  return (
    <section className="related">
      <h2>{title}</h2>
      {q.isPending ? (
        <Skeleton cards={5} />
      ) : q.isError ? (
        <ErrorBox error={q.error} retry={() => void q.refetch()} />
      ) : (
        <div className="related-grid">
          {q.data.items.slice(3, 8).map((n, i) => (
            <NftCard nft={n} index={i} key={n.id} />
          ))}
        </div>
      )}
      <div className="carousel-dots" aria-hidden="true">
        <img src="/assets/8db8a.svg" alt="" />
      </div>
    </section>
  );
}
function Filters({
  search,
  update,
  counts,
}: {
  search: CatalogSearch;
  update: (value: Partial<CatalogSearch>) => void;
  counts: Record<string, number>;
}) {
  const [min, setMin] = useState(search.min || "0.02");
  const [max, setMax] = useState(search.max || "12.30");
  function toggle(key: "categories" | "networks", v: string) {
    update({
      [key]: search[key].includes(v)
        ? search[key].filter((i) => i !== v)
        : [...search[key], v],
    });
  }
  return (
    <div className="filters">
      <label className="mobile-filter-sort">
        Ordenar por
        <select
          aria-label="Ordenar resultados"
          value={search.sort}
          onChange={(event) => update({ sort: event.target.value })}
        >
          <option value="recent">Listados recentemente</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
          <option value="popular">Mais populares</option>
        </select>
      </label>
      <fieldset>
        <legend>Coleções</legend>
        {categories.map((cat) => (
          <label
            key={cat}
            className={search.categories.includes(cat) ? "selected" : ""}
          >
            <input
              type="checkbox"
              checked={search.categories.includes(cat)}
              onChange={() => toggle("categories", cat)}
            />
            <span>{cat}</span>
            <b>({counts[cat] ?? 0})</b>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Faixa de preço</legend>
        <div className="price-slider">
          <input
            type="range"
            min="0.02"
            max="12.30"
            step="0.01"
            aria-label="Preço máximo"
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
        </div>
        <p>
          Preço: {min.replace(".", ",")} - {max.replace(".", ",")} ETH
        </p>
        <div className="price-inputs">
          <input
            aria-label="Preço mínimo em ETH"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            inputMode="decimal"
          />
          <input
            aria-label="Preço máximo em ETH"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <Button
          size="sm"
          onClick={() => {
            if (
              /^\d+(\.\d{1,18})?$/.test(min) &&
              /^\d+(\.\d{1,18})?$/.test(max)
            )
              update({ min, max });
          }}
        >
          Aplicar
        </Button>
      </fieldset>
      <fieldset>
        <legend>Rede</legend>
        {["Ethereum", "Polygon", "Solana"].map((network) => (
          <label
            className={search.networks.includes(network) ? "selected" : ""}
            key={network}
          >
            <input
              type="checkbox"
              checked={search.networks.includes(network)}
              onChange={() => toggle("networks", network)}
            />
            <span>{network}</span>
            <b>({counts[network] ?? 0})</b>
          </label>
        ))}
      </fieldset>
      {(search.categories.length > 0 ||
        search.networks.length > 0 ||
        search.min ||
        search.max) && (
        <Button
          variant="ghost"
          onClick={() =>
            update({ categories: [], networks: [], min: "", max: "" })
          }
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
export function Home({ background = false }: { background?: boolean }) {
  const search = validateSearch(useSearch({ strict: false }));
  const navigate = useNavigate();
  const location = useLocation();
  const mobile = useMobile();
  const q = useQuery({
    ...catalogQuery(search, mobile ? 6 : 9),
    placeholderData: (previous, previousQuery) => {
      const previousSearch = previousQuery?.queryKey[1] as
        CatalogSearch | undefined;
      return previousSearch &&
        previousQuery?.queryKey[2] === (mobile ? 6 : undefined) &&
        JSON.stringify({ ...previousSearch, page: 1 }) ===
          JSON.stringify({ ...search, page: 1 })
        ? previous
        : undefined;
    },
  });
  useEffect(() => {
    if (
      !q.data ||
      q.isPlaceholderData ||
      !q.data.pages ||
      search.page <= q.data.pages
    )
      return;
    void navigate({
      to: "/",
      search: { ...search, page: q.data.pages },
      hash: location.hash,
      replace: true,
      resetScroll: false,
      hashScrollIntoView: false,
      viewTransition: false,
    });
  }, [q.data, q.isPlaceholderData, search, navigate, location.hash]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [input, setInput] = useState(search.q);
  useEffect(() => setInput(search.q), [search.q]);
  const [editorial, setEditorial] = useState("");
  const update = (v: Partial<CatalogSearch>) => {
    void navigate({
      to: "/",
      search: (old) => ({ ...old, ...v, page: v.page ?? 1 }),
      hash: v.page !== undefined ? location.hash : "catalogo",
      resetScroll: v.page === undefined,
      hashScrollIntoView:
        v.page !== undefined
          ? false
          : {
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "instant"
                : "smooth",
              block: "start",
            },
      viewTransition: false,
    });
  };
  return (
    <>
      <Page className="home-shell" background={background}>
        <section className="hero">
          <img className="hero-bg" src="/assets/dc76c.svg" alt="" />
          <div className="hero-copy">
            <p className="eyebrow">Bem-vindo à Kurio</p>
            <h1>
              <span className="hero-desktop-title">
                SEJA DONO DO FUTURO
                <br />
                DA ARTE DIGITAL
              </span>
              <span className="hero-mobile-title">
                SEJA DONO DA
                <br />
                CULTURA DIGITAL
              </span>
            </h1>
            <p className="hero-description">
              <span className="hero-desktop-description">
                Descubra NFTs selecionados de criadores emergentes e
                consagrados. Colecione arte digital rara, apoie artistas e tenha
                uma parte da cultura da internet.
              </span>
              <span className="hero-mobile-description">
                Descubra NFTs selecionados de criadores do mundo todo.
              </span>
            </p>
            <Button asChild>
              <a href="#catalogo">
                EXPLORAR <ArrowRight className="hero-mobile-arrow" size={18} />
              </a>
            </Button>
            <img className="hero-dots" src="/assets/a11b7.svg" alt="" />
          </div>
          <div className="hero-artwork">
            <Artwork
              src="/assets/8f387.png"
              className="hero-art"
              alt="Emerald Ape, macaco com óculos e jaqueta verde"
              width="450"
              height="450"
              fetchPriority="high"
              loading="eager"
              sizes="(max-width:768px) 38vw, 450px"
            />
            <Artwork
              thumbnail
              className="hero-companion"
              src="/assets/83794.png"
              alt=""
              width="59"
              height="59"
              sizes="59px"
              loading="eager"
            />
          </div>
          <img className="hero-mobile-dots" src="/assets/a11b7.svg" alt="" />
        </section>
        <section
          className="catalog"
          id="catalogo"
          aria-label="Catálogo de NFTs"
        >
          <aside className="catalog-sidebar">
            <Filters
              search={search}
              update={update}
              counts={q.data?.counts || {}}
            />
            <Link to="/nft/$id" params={{ id: "2" }} className="featured">
              <h2>NFT EM DESTAQUE</h2>
              <p>OFERTA LIMITADA</p>
              <Artwork
                src="/assets/83794.png"
                alt="Sage Nomad, NFT em destaque"
                loading="lazy"
                width="310"
                height="368"
              />
            </Link>
          </aside>
          <div className="catalog-main">
            <h2 className="sr-only">NFTs disponíveis</h2>
            <div className="catalog-toolbar">
              <div
                className="catalog-tabs"
                role="group"
                aria-label="Destaques do catálogo"
              >
                {[
                  ["all", "Todos os NFTs"],
                  ["new", "Novos lançamentos"],
                  ["trending", "Em alta"],
                ].map(([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => update({ tab })}
                    aria-pressed={search.tab === tab}
                    className={search.tab === tab ? "active" : ""}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="sort-label">
                <span>Ordenar por:</span>
                <span className="sort-control">
                  <span aria-hidden="true">
                    {
                      {
                        recent: "Listados recentemente",
                        "price-asc": "Menor preço",
                        "price-desc": "Maior preço",
                        popular: "Mais populares",
                      }[search.sort]
                    }
                  </span>
                  <span className="sort-chevron" aria-hidden="true">
                    <img src="/assets/7e373.svg" alt="" />
                  </span>
                  <select
                    aria-label="Ordenar NFTs"
                    value={search.sort}
                    onChange={(e) => update({ sort: e.target.value })}
                  >
                    <option value="recent">Listados recentemente</option>
                    <option value="price-asc">Menor preço</option>
                    <option value="price-desc">Maior preço</option>
                    <option value="popular">Mais populares</option>
                  </select>
                </span>
              </label>
            </div>
            <form
              className="catalog-search"
              onSubmit={(e) => {
                e.preventDefault();
                update({ q: input });
              }}
            >
              <input
                aria-label="Buscar no catálogo"
                placeholder="Buscar NFTs"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button type="submit" variant="outline">
                Buscar
              </Button>
              <Button
                className="filter-trigger"
                aria-label="Filtros"
                size="icon"
                type="button"
                variant="outline"
                onClick={() => setFiltersOpen(true)}
              >
                <Settings2 size={24} strokeWidth={1.5} />
              </Button>
            </form>
            {search.q && (
              <p className="search-result">
                Busca: “{search.q}”{" "}
                <button
                  aria-label="Limpar busca"
                  onClick={() => {
                    setInput("");
                    update({ q: "" });
                  }}
                >
                  <X size={14} />
                </button>
              </p>
            )}
            {q.isPending ? (
              <Skeleton cards={mobile ? 6 : 9} />
            ) : q.isError ? (
              <ErrorBox error={q.error} retry={() => void q.refetch()} />
            ) : !q.data ? (
              <Skeleton cards={mobile ? 6 : 9} />
            ) : q.data.items.length === 0 ? (
              <Empty title="Nenhum NFT encontrado">
                <p>Tente outra busca ou remova alguns filtros.</p>
                <Button
                  onClick={() => {
                    setInput("");
                    update(defaultSearch);
                  }}
                >
                  Limpar busca e filtros
                </Button>
              </Empty>
            ) : (
              <>
                <div className="nft-grid" aria-busy={q.isFetching}>
                  {q.data.items.map((n, i) => (
                    <NftCard nft={n} index={i} key={n.id} />
                  ))}
                </div>
                <nav className="pagination" aria-label="Paginação">
                  {Array.from({ length: q.data.pages }, (_, i) => (
                    <button
                      key={i}
                      aria-label={`Página ${i + 1}`}
                      aria-current={search.page === i + 1 ? "page" : undefined}
                      onClick={() => update({ page: i + 1 })}
                    >
                      {i + 1}
                    </button>
                  ))}
                  {q.data.pages > 1 && (
                    <button
                      aria-label="Próxima página"
                      disabled={search.page >= q.data.pages}
                      onClick={() => update({ page: search.page + 1 })}
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </nav>
              </>
            )}
          </div>
        </section>
        <section className="promos" id="criadores">
          {[
            [
              "8f387.png",
              "Lançamentos gênesis de edição limitada",
              "Colecione edições escassas diretamente dos criadores antes da revelação pública.",
            ],
            [
              "9add2.png",
              "Arte digital selecionada e muito mais",
              "Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.",
            ],
          ].map(([image, title, description], i) => (
            <div className="promo" key={title}>
              <img className="promo-mask" src="/assets/68d8c.svg" alt="" />
              <Artwork
                sizes="(max-width: 768px) max(200px, calc((100vw - 56px) * 0.45)), (max-width: 900px) 250px, (max-width: 1300px) max(250px, calc((100vw - 124px) * 0.245)), 287px"
                className="promo-art"
                src={"/assets/" + image}
                alt=""
                loading="lazy"
              />
              <div>
                <h2>
                  {i ? (
                    <>
                      Arte digital selecionada
                      <br />e muito mais
                    </>
                  ) : (
                    <>
                      Lançamentos gênesis
                      <br />
                      de edição limitada
                    </>
                  )}
                </h2>
                <p>{description}</p>
                <Button
                  size="sm"
                  onClick={() =>
                    update({
                      categories: [i ? "Arte digital" : "Colecionáveis"],
                    })
                  }
                >
                  Explorar
                  <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          ))}
        </section>
        <section className="journal" id="diario">
          <h2>Diário da Cunhagem</h2>
          <p>
            Histórias, guias e insights para colecionadores sobre o universo da
            propriedade digital.
          </p>
          <div className="journal-grid">
            {[
              [
                "9add2.png",
                "12",
                "6",
                "Como funciona a propriedade de NFTs",
                "Aprenda a colecionar, negociar e verificar ativos digitais.",
              ],
              [
                "8f387.png",
                "13",
                "2",
                "10 artistas digitais para acompanhar",
                "Conheça criadores que moldam a cultura digital.",
              ],
              [
                "83794.png",
                "15",
                "3",
                "Raridade, atributos e procedência",
                "Entenda raridade, procedência, direitos autorais e utilidade.",
              ],
              [
                "b7cfc.png",
                "15",
                "2",
                "Como proteger sua carteira",
                "Proteja sua carteira, seus ativos e sua identidade.",
              ],
            ].map(([img, day, min, title, desc]) => (
              <article key={title}>
                <Artwork
                  src={"/assets/" + img}
                  alt=""
                  width="268"
                  height="195"
                  sizes="(max-width: 768px) max(160px, calc((100vw - 72px) / 2)), (max-width: 1300px) max(195px, calc((100vw - 168px) / 4)), 268px"
                  loading="lazy"
                />
                <div>
                  <small>
                    {day} de setembro | Leitura de {min} min
                  </small>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <button onClick={() => setEditorial(title)}>
                    Ler mais →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </Page>
      <BottomNav />
      <Dialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filtrar NFTs"
      >
        <Filters
          search={search}
          update={update}
          counts={q.data?.counts || {}}
        />
        <Button onClick={() => setFiltersOpen(false)}>Ver resultados</Button>
      </Dialog>
      <Dialog
        open={!!editorial}
        onOpenChange={() => setEditorial("")}
        title={editorial}
        description="Conteúdo editorial fora do escopo desta demonstração."
      >
        <p className="mt-5">
          Explore o catálogo para conhecer as obras e experimentar o fluxo de
          coleção.
        </p>
        <Button className="mt-5" onClick={() => setEditorial("")}>
          Continuar explorando
        </Button>
      </Dialog>
    </>
  );
}
