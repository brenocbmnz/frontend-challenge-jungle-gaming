import {
  createRootRoute,
  createRoute,
  createRouter,
  stripSearchParams,
  Outlet,
  Link,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { defaultSearch, validateSearch } from "./api/queries";
import { SessionProvider } from "./components/session";
import { Realtime } from "./components/realtime";
import { Home } from "./pages/home";
import { RequireAuth } from "./components/require-auth";
import { ErrorBox } from "./components/common";
const Detail = lazy(() =>
  import("./pages/detail").then((m) => ({ default: m.Detail })),
);
const Cart = lazy(() =>
  import("./pages/cart").then((m) => ({ default: m.CartPage })),
);
const Checkout = lazy(() =>
  import("./pages/checkout").then((m) => ({ default: m.Checkout })),
);
const Order = lazy(() =>
  import("./pages/checkout").then((m) => ({ default: m.OrderPage })),
);
const Auth = lazy(() =>
  import("./pages/auth").then((m) => ({ default: m.Auth })),
);
const Profile = lazy(() =>
  import("./pages/account").then((m) => ({ default: m.Profile })),
);
const Wallets = lazy(() =>
  import("./pages/account").then((m) => ({ default: m.Wallets })),
);
const Favorites = lazy(() =>
  import("./pages/account").then((m) => ({ default: m.Favorites })),
);
const Demo = lazy(() =>
  import("./pages/demo").then((m) => ({ default: m.Demo })),
);
const root = createRootRoute({
  component: () => (
    <SessionProvider>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <Realtime />
      <Suspense
        fallback={
          <div className="route-loading" role="status">
            Carregando…
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </SessionProvider>
  ),
  notFoundComponent: () => (
    <main className="not-found">
      <h1>Página não encontrada</h1>
      <Link to="/">Voltar ao início</Link>
    </main>
  ),
  errorComponent: ({ error, reset }) => (
    <ErrorBox error={error} retry={reset} />
  ),
});
const home = createRoute({
  getParentRoute: () => root,
  path: "/",
  validateSearch,
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  component: Home,
});
const detail = createRoute({
  getParentRoute: () => root,
  path: "/nft/$id",
  component: Detail,
});
const cart = createRoute({
  getParentRoute: () => root,
  path: "/carrinho",
  component: Cart,
});
const checkout = createRoute({
  getParentRoute: () => root,
  path: "/pagamento",
  component: () => (
    <RequireAuth>
      <Checkout />
    </RequireAuth>
  ),
});
const order = createRoute({
  getParentRoute: () => root,
  path: "/pedido/$id",
  component: () => (
    <RequireAuth>
      <Order />
    </RequireAuth>
  ),
});
const login = createRoute({
  getParentRoute: () => root,
  path: "/login",
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: () => <Auth />,
});
const register = createRoute({
  getParentRoute: () => root,
  path: "/cadastro",
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: () => <Auth register />,
});
const profile = createRoute({
  getParentRoute: () => root,
  path: "/perfil",
  component: () => (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  ),
});
const wallets = createRoute({
  getParentRoute: () => root,
  path: "/carteiras",
  component: () => (
    <RequireAuth>
      <Wallets />
    </RequireAuth>
  ),
});
const favorites = createRoute({
  getParentRoute: () => root,
  path: "/favoritos",
  component: () => (
    <RequireAuth>
      <Favorites />
    </RequireAuth>
  ),
});
const demo = createRoute({
  getParentRoute: () => root,
  path: "/demonstracao",
  component: Demo,
});
export const router = createRouter({
  routeTree: root.addChildren([
    home,
    detail,
    cart,
    checkout,
    order,
    login,
    register,
    profile,
    wallets,
    favorites,
    demo,
  ]),
  scrollRestoration: true,
  defaultViewTransition: {
    types: ({ fromLocation, pathChanged }) =>
      fromLocation &&
      pathChanged &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? ["page"]
        : false,
  },
  defaultPreload: "intent",
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
