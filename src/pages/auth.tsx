import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import type { User } from "../api/contracts";
import { api, errorData } from "../api/client";
import { useSession } from "../components/session";
import { ErrorBox, Field } from "../components/common";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { Home } from "./home";
export function Auth({ register = false }: { register?: boolean }) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [username, setUsername] = useState("");
  const [auxiliary, setAuxiliary] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      if (register)
        await api.post("/register", { email, password, confirm, username });
      return (
        await api.post<{ token: string; user: User }>("/login", {
          email,
          password,
        })
      ).data;
    },
    onSuccess: async (data) => {
      await login(data.token);
      const redirect =
        search.redirect?.startsWith("/") && !search.redirect.startsWith("//")
          ? search.redirect
          : "/perfil";
      await navigate({ to: redirect, replace: true });
    },
  });
  const fields = mutation.error ? errorData(mutation.error).fields : undefined;
  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }
  return (
    <div className="auth-page">
      <div className="auth-backdrop" aria-hidden="true" inert>
        <Home background />
      </div>
      <div className="auth-scrim" />
      <main
        id="main-content"
        tabIndex={-1}
        className={`auth-card ${register ? "register-card" : ""}`}
      >
        <Link to="/" aria-label="Kurio — Início" className="auth-logo">
          KURIO
        </Link>
        <h1>{register ? "Criar perfil de colecionador" : "Entrar"}</h1>
        <div className="desktop-auth-head">
          <div>
            <Link
              to="/login"
              search={{ redirect: search.redirect }}
              className={!register ? "active" : ""}
            >
              Entrar
            </Link>
            <span>|</span>
            <Link
              to="/cadastro"
              search={{ redirect: search.redirect }}
              className={register ? "active" : ""}
            >
              Criar conta
            </Link>
          </div>
          <p>
            {register
              ? "Crie seu perfil de colecionador e conecte uma carteira quando quiser."
              : "Entre no seu perfil e continue sua coleção."}
          </p>
        </div>
        <form onSubmit={submit} noValidate>
          {register && (
            <Field
              label="Nome de usuário"
              placeholder="Nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              error={fields?.username}
              required
            />
          )}
          <Field
            label="E-mail"
            type="email"
            placeholder={register ? "Digite seu e-mail" : "contato@email.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            error={fields?.email}
            required
          />
          <Field
            label="Senha"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={register ? "new-password" : "current-password"}
            error={fields?.password}
            required
          />
          {register && (
            <Field
              label="Confirmar senha"
              type="password"
              placeholder="Confirmar senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              error={fields?.confirm}
              required
            />
          )}
          {!register && (
            <button
              className="forgot-link"
              type="button"
              onClick={() => setAuxiliary("Recuperação de senha")}
            >
              Esqueceu a senha?
            </button>
          )}
          {mutation.isError && <ErrorBox error={mutation.error} />}
          <Button
            type="submit"
            className="auth-submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? "Aguarde…"
              : register
                ? "Criar perfil"
                : "Entrar"}
          </Button>
        </form>
        <div className="social-auth">
          <p>Ou continue com</p>
          <Button variant="outline" onClick={() => setAuxiliary("Google")}>
            <GoogleMark />
            Continuar com Google
          </Button>
          <Button variant="outline" onClick={() => setAuxiliary("Facebook")}>
            <img src="/assets/5561e.svg" alt="" />
            Continuar com Facebook
          </Button>
        </div>
        <p className="auth-switch">
          {register ? (
            <Link to="/login" search={{ redirect: search.redirect }}>
              Já tem uma conta? Entre
            </Link>
          ) : (
            <Link to="/cadastro" search={{ redirect: search.redirect }}>
              Novo na Kurio? Crie uma conta
            </Link>
          )}
        </p>
        <Link to="/" className="auth-close" aria-label="Fechar">
          ×
        </Link>
      </main>
      <Dialog
        open={!!auxiliary}
        onOpenChange={() => setAuxiliary("")}
        title={auxiliary}
        description="Esta ação não faz parte da demonstração."
      >
        <p className="mt-4">
          Use o formulário de e-mail e senha. Para testar: nova@kurio.test /
          Kurio123!
        </p>
        <Button className="mt-4" onClick={() => setAuxiliary("")}>
          Voltar
        </Button>
      </Dialog>
    </div>
  );
}

function GoogleMark() {
  return (
    <span className="google-mark" aria-hidden="true">
      <img className="google-piece p0" src="/assets/88a3c.svg" alt="" />
      <img className="google-piece p1" src="/assets/75804.svg" alt="" />
      <img className="google-piece p2" src="/assets/a3c98.svg" alt="" />
      <img className="google-piece p3" src="/assets/1c266.svg" alt="" />
      <img className="google-piece p4" src="/assets/1174b.svg" alt="" />
      <img className="google-piece p5" src="/assets/5f1dc.svg" alt="" />
      <img className="google-piece p6" src="/assets/e1073.svg" alt="" />
    </span>
  );
}
