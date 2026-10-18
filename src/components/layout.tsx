import {
  Link,
  useLocation,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import {
  Search,
  ShoppingCart,
  ArrowLeft,
  UserRound,
  Menu,
  X,
  Home as HomeIcon,
  Heart,
  ScanLine,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useId, useRef, type ReactNode } from "react";
import { useDismissible } from "../hooks/use-dismissible";
import { useMobile } from "../hooks/use-mobile";
import { UserAvatar } from "./user-avatar";
import { cartQuery, validateSearch } from "../api/queries";
import { useSession } from "./session";
import { Button } from "./ui/button";
import { Dialog } from "./dialog";
import { useReducedMotion } from "../lib/motion";
export function Header() {
  const { user, uid } = useSession();
  const { data: cart } = useQuery(cartQuery(uid));
  const location = useLocation();
  const navigate = useNavigate();
  const validatedHomeSearch = validateSearch(useSearch({ strict: false }));
  const homeSearch = location.pathname === "/" ? validatedHomeSearch : {};
  const reducedMotion = useReducedMotion();
  const mobile = useMobile();
  const sectionScroll: ScrollIntoViewOptions = {
    behavior: reducedMotion ? "instant" : "smooth",
    block: "start",
  };
  const itemCount =
    cart?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const market = ![
    "/",
    "/perfil",
    "/carteiras",
    "/login",
    "/cadastro",
  ].includes(location.pathname);
  const currentSection =
    location.pathname === "/"
      ? location.hash || "inicio"
      : market
        ? "catalogo"
        : "inicio";
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
  const menuId = useId();
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const menuRegion = useRef<HTMLElement>(null);
  useDismissible(menu && mobile, menuRegion, menuTrigger, () => setMenu(false));
  return (
    <>
      {location.pathname === "/" && (
        <button
          className="home-search-trigger"
          aria-label="Buscar NFTs"
          onClick={() => setSearch(true)}
        >
          <Search size={22} /> Explorar coleções
        </button>
      )}
      <header
        ref={menuRegion}
        id={location.pathname === "/" ? "inicio" : undefined}
        className={`header ${market ? "market-header" : ""}`}
      >
        <Link to="/" className="brand" aria-label="Kurio — Início">
          KURIO
        </Link>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <Link
            to="/"
            search={homeSearch}
            hash="inicio"
            hashScrollIntoView={sectionScroll}
            resetScroll={false}
            viewTransition={false}
            activeProps={{ className: "" }}
            className={currentSection === "inicio" ? "active" : ""}
          >
            Início
          </Link>
          <Link
            to="/"
            hash="catalogo"
            search={homeSearch}
            hashScrollIntoView={sectionScroll}
            resetScroll={false}
            viewTransition={false}
            activeProps={{ className: "" }}
            className={currentSection === "catalogo" ? "active" : ""}
          >
            Mercado
          </Link>
          <Link
            to="/"
            search={homeSearch}
            hash="criadores"
            className={currentSection === "criadores" ? "active" : ""}
            activeProps={{ className: "" }}
            hashScrollIntoView={sectionScroll}
            resetScroll={false}
            viewTransition={false}
          >
            Criadores
          </Link>
          <Link
            to="/"
            search={homeSearch}
            hash="diario"
            className={currentSection === "diario" ? "active" : ""}
            activeProps={{ className: "" }}
            hashScrollIntoView={sectionScroll}
            resetScroll={false}
            viewTransition={false}
          >
            Aprenda
          </Link>
        </nav>
        <div className="header-actions">
          <button aria-label="Buscar NFTs" onClick={() => setSearch(true)}>
            <img src="/assets/bd8c9.svg" alt="" width="20" height="20" />
          </button>
          <Link
            to="/carrinho"
            aria-label={`Carrinho, ${itemCount} itens`}
            className="cart-link"
          >
            <img src="/assets/c0c08.svg" alt="" width="24.004" height="24" />
            <span>{itemCount}</span>
          </Link>
          {!mobile && (
            <Button asChild size="sm" className="account-link">
              <Link
                to={user ? "/perfil" : "/login"}
                aria-label={user ? "Perfil" : "Entrar"}
              >
                {user ? (
                  <UserAvatar
                    src={user.avatar}
                    label={`Avatar de ${user.name}`}
                  />
                ) : (
                  <img src="/assets/62554.svg" alt="" />
                )}
                <span>{user ? "Perfil" : "Entrar"}</span>
              </Link>
            </Button>
          )}
          <button
            className="mobile-menu"
            ref={menuTrigger}
            aria-expanded={menu}
            aria-controls={menuId}
            onClick={() => setMenu((v) => !v)}
            aria-label="Abrir navegação"
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
        {menu && (
          <nav className="mobile-links" id={menuId} aria-label="Menu mobile">
            <Link to="/" onClick={() => setMenu(false)}>
              Início
            </Link>
            <Link to="/perfil" onClick={() => setMenu(false)}>
              Meu perfil
            </Link>
            <Link to="/carteiras" onClick={() => setMenu(false)}>
              Carteiras
            </Link>
          </nav>
        )}
      </header>
      <Dialog open={search} onOpenChange={setSearch} title="Buscar NFTs">
        <form
          action="/"
          onSubmit={(event) => {
            event.preventDefault();
            void navigate({ to: "/", search: { q }, hash: "catalogo" });
            setSearch(false);
          }}
          className="flex gap-3 mt-5"
        >
          <input
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Nome do NFT"
            placeholder="Busque uma obra ou coleção"
          />
          <Button type="submit">
            <Search size={18} />
            Buscar
          </Button>
        </form>
      </Dialog>
    </>
  );
}
export function MobileTitle({
  title,
  back = "/",
}: {
  title: string;
  back?: string;
}) {
  return (
    <div className="mobile-title">
      <Link to={back} aria-label="Voltar">
        <ArrowLeft size={20} />
      </Link>
      <h1>{title}</h1>
    </div>
  );
}
const columns = [
  [
    "Meu perfil",
    "Meu perfil",
    "Minha coleção",
    "Atividade",
    "Estúdio do criador",
    "Lista de interesse",
  ],
  [
    "Central de ajuda",
    "Central de ajuda",
    "Como comprar NFTs",
    "Carteira e segurança",
    "Política do mercado",
    "Denunciar item",
  ],
  ["Coleções", "Arte digital", "Fotografia", "Música", "Arte 3D", "Utilidade"],
];
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-features">
        {[
          [
            "W",
            "Segurança da carteira",
            "Proteja sua carteira e colecione arte digital verificada com confiança.",
          ],
          [
            "C",
            "Criadores em destaque",
            "Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.",
          ],
          [
            "D",
            "Alertas de lançamentos",
            "Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.",
          ],
        ].map(([letter, title, text]) => (
          <div className="feature" key={letter}>
            <span className="medallion">{letter}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
        <div className="newsletter">
          <h3>Antecipe-se ao próximo lançamento</h3>
          <form onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              aria-label="E-mail para novidades"
              placeholder="digite seu e-mail..."
              disabled
            />
            <Button disabled>Enviar</Button>
          </form>
          <p>
            Receba lançamentos selecionados, histórias de criadores e novidades
            do mercado.
          </p>
        </div>
      </div>
      <div className="brand-band">
        <b className="brand">KURIO</b>
        <p>
          Feito para colecionadores,
          <br />
          criadores e cultura
        </p>
        <a href="mailto:contato@email.com">contato@email.com</a>
        <a href="tel:+551140028922">+55 11 4002 8922</a>
      </div>
      <div className="footer-columns">
        {columns.map((col, i) => (
          <div key={col[0]}>
            <h3>{col[0]}</h3>
            {col.slice(1).map((label, j) =>
              i === 0 && j === 0 ? (
                <Link key={label} to="/perfil">
                  {label}
                </Link>
              ) : i === 2 ? (
                <Link
                  key={label}
                  to="/"
                  search={{ categories: [label], page: 1 }}
                  hash="catalogo"
                >
                  {label}
                </Link>
              ) : (
                <span
                  key={label}
                  aria-disabled="true"
                  title="Fora do escopo da demonstração"
                >
                  {label}
                </span>
              ),
            )}
          </div>
        ))}
        <div>
          <h3>Redes sociais</h3>
          <div className="socials">
            {[
              "99280.svg",
              "d48dd.svg",
              "b4111.svg",
              "b8b84.svg",
              "ca2da.svg",
            ].map((src, i) => (
              <a
                href={
                  [
                    "https://facebook.com",
                    "https://instagram.com",
                    "https://x.com",
                    "https://linkedin.com",
                    "https://youtube.com",
                  ][i]
                }
                target="_blank"
                rel="noreferrer"
                key={src}
                aria-label={
                  ["Facebook", "Instagram", "X", "LinkedIn", "YouTube"][i]
                }
              >
                <img
                  src={"/assets/" + src}
                  alt=""
                  width="32"
                  height="32"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
          <h3 className="mt-8">Carteiras compatíveis</h3>
          <p className="wallet-chip">METAMASK • WALLETCONNECT • COINBASE</p>
        </div>
      </div>
      <p className="copyright">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  );
}
export function Page({
  children,
  account = false,
  className = "",
  background = false,
}: {
  children: ReactNode;
  account?: boolean;
  className?: string;
  background?: boolean;
}) {
  return (
    <div className={`shell ${account ? "account-shell" : ""} ${className}`}>
      <Header />
      <main
        id={background ? undefined : "main-content"}
        tabIndex={background ? undefined : -1}
      >
        {children}
      </main>
      {!account && <Footer />}
    </div>
  );
}
export function Breadcrumb({ children }: { children: ReactNode }) {
  return (
    <div className="breadcrumb">
      <Link to="/">Início</Link> /{" "}
      <Link to="/" hash="catalogo">
        Mercado
      </Link>{" "}
      / {children}
    </div>
  );
}
export function BottomNav() {
  const reducedMotion = useReducedMotion();
  const location = useLocation();
  const search = validateSearch(useSearch({ strict: false }));
  return (
    <nav className="bottom-nav" aria-label="Atalhos">
      <Link to="/" aria-label="Início">
        <HomeIcon size={21} fill="currentColor" />
      </Link>
      <Link to="/favoritos" aria-label="Lista de interesse">
        <Heart size={22} fill="currentColor" />
      </Link>
      <Link
        to="/"
        hash="catalogo"
        search={location.pathname === "/" ? search : {}}
        resetScroll={false}
        hashScrollIntoView={{
          behavior: reducedMotion ? "instant" : "smooth",
          block: "start",
        }}
        viewTransition={false}
        onClick={(event) => {
          if (
            location.pathname === "/" &&
            location.hash === "catalogo" &&
            event.button === 0 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.shiftKey &&
            !event.altKey
          ) {
            event.preventDefault();
            document.getElementById("catalogo")?.scrollIntoView({
              behavior: reducedMotion ? "instant" : "smooth",
              block: "start",
            });
          }
        }}
        className="scan-link"
        aria-label="Explorar catálogo"
      >
        <ScanLine size={28} />
      </Link>
      <Link to="/carrinho" aria-label="Carrinho">
        <ShoppingCart size={22} />
      </Link>
      <Link to="/perfil" aria-label="Perfil">
        <UserRound size={22} />
      </Link>
    </nav>
  );
}
