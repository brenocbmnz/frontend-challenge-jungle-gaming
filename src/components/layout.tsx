import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Search,
  ShoppingCart,
  LogIn,
  ArrowLeft,
  UserRound,
  Menu,
  X,
  Home as HomeIcon,
  Heart,
  ScanLine,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { cartQuery } from "../api/queries";
import { useSession } from "./session";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
export function Header() {
  const { user, uid } = useSession();
  const { data: cart } = useQuery(cartQuery(uid));
  const location = useLocation();
  const navigate = useNavigate();
  const market = ![
    "/",
    "/perfil",
    "/carteiras",
    "/login",
    "/cadastro",
  ].includes(location.pathname);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
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
      <header className={`header ${market ? "market-header" : ""}`}>
        <Link to="/" className="brand" aria-label="Kurio — Início">
          KURIO
        </Link>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <Link
            to="/"
            activeProps={{ className: "" }}
            className={!market ? "active" : ""}
          >
            Início
          </Link>
          <Link
            to="/"
            hash="catalogo"
            activeProps={{ className: "" }}
            className={market ? "active" : ""}
          >
            Mercado
          </Link>
          <a href="/#criadores">Criadores</a>
          <a href="/#diario">Aprenda</a>
        </nav>
        <div className="header-actions">
          <button aria-label="Buscar NFTs" onClick={() => setSearch(true)}>
            <img src="/assets/bd8c9.svg" alt="" width="20" height="20" />
          </button>
          <Link
            to="/carrinho"
            aria-label={`Carrinho, ${cart?.items.reduce((a, i) => a + i.quantity, 0) || 0} itens`}
            className="cart-link"
          >
            <img src="/assets/c0c08.svg" alt="" width="24.004" height="24" />
            <span>{cart?.items.reduce((a, i) => a + i.quantity, 0) || 0}</span>
          </Link>
          <Button asChild size="sm" className="account-link">
            <Link
              to={user ? "/perfil" : "/login"}
              aria-label={user ? "Meu perfil" : "Entrar"}
            >
              {user ? <UserRound size={17} /> : <LogIn size={17} />}
              <span>{user ? "Meu perfil" : "Entrar"}</span>
            </Link>
          </Button>
          <button
            className="mobile-menu"
            onClick={() => setMenu((v) => !v)}
            aria-label="Abrir navegação"
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {menu && (
        <nav className="mobile-links" aria-label="Menu mobile">
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
          <small>Inscrições indisponíveis nesta demonstração.</small>
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
}: {
  children: ReactNode;
  account?: boolean;
  className?: string;
}) {
  return (
    <div className={`shell ${account ? "account-shell" : ""} ${className}`}>
      <Header />
      <main id="main-content">{children}</main>
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
