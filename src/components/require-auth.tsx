import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useSession } from "./session";
import { Button } from "./ui/button";
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, expired } = useSession();
  if (loading)
    return (
      <div className="auth-loading" role="status">
        Recuperando sessão…
      </div>
    );
  if (!user)
    return (
      <div className="auth-required">
        <h1>{expired ? "Sua sessão expirou" : "Entre para continuar"}</h1>
        <p>Seu carrinho e o contexto da compra foram preservados.</p>
        <Button asChild>
          <Link
            to="/login"
            search={{ redirect: location.pathname + location.search }}
          >
            Entrar
          </Link>
        </Button>
      </div>
    );
  return children;
}
