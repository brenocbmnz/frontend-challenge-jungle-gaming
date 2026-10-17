import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Wallet as WalletIcon } from "lucide-react";
import type { Network, User, Wallet } from "../api/contracts";
import { api, errorData, get } from "../api/client";
import {
  catalogQuery,
  defaultSearch,
  favoritesQuery,
  queryClient,
  walletsQuery,
} from "../api/queries";
import { Page } from "../components/layout";
import { useSession } from "../components/session";
import { Empty, ErrorBox, Field, Skeleton } from "../components/common";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { NftCard } from "./home";
export function AccountSidebar() {
  const { logout } = useSession();
  const navigate = useNavigate();
  return (
    <aside className="account-sidebar">
      <h2>Meu perfil</h2>
      <nav aria-label="Conta do colecionador">
        <Link to="/perfil" activeProps={{ className: "active" }}>
          <i className="account-icon">
            <img src="/assets/55e96.svg" alt="" />
          </i>
          Dados do perfil
        </Link>
        <Link to="/carteiras" activeProps={{ className: "active" }}>
          <i className="account-icon">
            <img src="/assets/8a4e9.svg" alt="" />
          </i>
          Carteiras
        </Link>
        <span aria-disabled="true">
          <i className="account-icon">
            <img src="/assets/0586d.svg" alt="" />
          </i>
          Atividade
        </span>
        <Link to="/favoritos" activeProps={{ className: "active" }}>
          <i className="account-icon">
            <img src="/assets/8b13b.svg" alt="" />
          </i>
          Lista de interesse
        </Link>
        {[
          ["Ofertas", "83e14"],
          ["Arquivos baixados", "65d5d"],
          ["Suporte", "8d6ff"],
        ].map(([label, icon]) => (
          <span key={label} aria-disabled="true">
            <i className="account-icon">
              <img src={`/assets/${icon}.svg`} alt="" />
            </i>
            {label}
          </span>
        ))}
        <button
          onClick={async () => {
            await logout();
            await navigate({ to: "/" });
          }}
        >
          <i className="account-icon">
            <img src="/assets/eaa87.svg" alt="" />
          </i>
          Sair
        </button>
      </nav>
    </aside>
  );
}
export function Profile() {
  const { user, uid } = useSession();
  const q = useQuery({
    queryKey: ["profile", uid],
    queryFn: ({ signal }) => get<User>("/profile", signal),
  });
  return (
    <Page account>
      <div className="account-layout">
        <AccountSidebar />
        {q.isPending ? (
          <Skeleton cards={2} />
        ) : q.isError ? (
          <ErrorBox error={q.error} retry={() => void q.refetch()} />
        ) : (
          <ProfileForm key={user?.id} profile={q.data} />
        )}
      </div>
    </Page>
  );
}
function ProfileForm({ profile }: { profile: User }) {
  const { uid } = useSession();
  const [form, setForm] = useState({
    ...profile,
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [avatarError, setAvatarError] = useState("");
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({
    mutationFn: async () => (await api.patch<User>("/profile", form)).data,
    onSuccess: (data) => {
      setSaved(true);
      setForm({ ...data, currentPassword: "", newPassword: "", confirm: "" });
      queryClient.setQueryData(["profile", uid], data);
      void queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
  const fields = mutation.error ? errorData(mutation.error).fields : undefined;
  function change(key: keyof typeof form, value: string) {
    setSaved(false);
    setForm((old) => ({ ...old, [key]: value }));
  }
  return (
    <section className="profile-form">
      <h1>Perfil do colecionador</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        noValidate
      >
        <div className="profile-grid">
          <Field
            label="Nome de exibição"
            value={form.name}
            onChange={(e) => change("name", e.target.value)}
            error={fields?.name}
            required
          />
          <Field
            label="Nome de usuário"
            value={form.username}
            onChange={(e) => change("username", e.target.value)}
            error={fields?.username}
            required
          />
          <Field
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => change("email", e.target.value)}
            error={fields?.email}
            required
          />
          <Field
            label="Nome ENS"
            value={form.ens}
            onChange={(e) => change("ens", e.target.value)}
            placeholder="seu-nome.eth"
          />
          <Field
            label="Apelido da carteira"
            value={form.walletNickname}
            onChange={(e) => change("walletNickname", e.target.value)}
          />
          <div className="avatar-field">
            <label htmlFor="avatar">Avatar</label>
            <div>
              {form.avatar ? (
                <img src={form.avatar} alt="Seu avatar" />
              ) : (
                <i className="avatar-placeholder">
                  <img src="/assets/19cc8.svg" alt="" />
                </i>
              )}
              <label className="upload-button" htmlFor="avatar">
                Alterar
              </label>
              <input
                id="avatar"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (
                    !["image/png", "image/jpeg", "image/webp"].includes(
                      f.type,
                    ) ||
                    f.size > 1024 * 1024
                  ) {
                    setAvatarError("Use PNG, JPEG ou WebP de até 1 MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setAvatarError("");
                    change("avatar", String(reader.result));
                  };
                  reader.readAsDataURL(f);
                }}
              />
              <button type="button" onClick={() => change("avatar", "")}>
                Remover
              </button>
            </div>
            {avatarError && <p role="alert">{avatarError}</p>}
          </div>
        </div>
        <h2>Alterar senha</h2>
        <div className="password-fields">
          <Field
            label="Senha atual"
            type="password"
            value={form.currentPassword}
            onChange={(e) => change("currentPassword", e.target.value)}
            error={fields?.currentPassword}
            autoComplete="current-password"
          />
          <Field
            label="Nova senha"
            type="password"
            value={form.newPassword}
            onChange={(e) => change("newPassword", e.target.value)}
            error={fields?.newPassword}
            autoComplete="new-password"
          />
          <Field
            label="Confirmar nova senha"
            type="password"
            value={form.confirm}
            onChange={(e) => change("confirm", e.target.value)}
            error={fields?.confirm}
            autoComplete="new-password"
          />
        </div>
        {mutation.isError && <ErrorBox error={mutation.error} />}{" "}
        {saved && <p role="status">Perfil salvo com sucesso.</p>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </form>
    </section>
  );
}
const blank: Wallet = {
  id: "new",
  label: "",
  address: "",
  network: "Ethereum",
  provider: "MetaMask",
  primary: false,
};
export function Wallets() {
  const { uid, user } = useSession();
  const q = useQuery(walletsQuery(uid));
  const [editing, setEditing] = useState<Wallet>();
  return (
    <Page account>
      <div className="account-layout">
        <AccountSidebar />
        <section className="wallets-page">
          <div className="flex justify-between gap-3 items-center">
            <h1>Carteira principal</h1>
            <Button
              variant="ghost"
              aria-label="Adicionar carteira"
              onClick={() => setEditing({ ...blank })}
            >
              Adicionar
            </Button>
          </div>
          <p className="wallet-intro">
            Estas carteiras ficam disponíveis no pagamento e para receber NFTs
            comprados.
          </p>
          {q.isPending ? (
            <Skeleton cards={2} />
          ) : q.isError ? (
            <ErrorBox error={q.error} retry={() => void q.refetch()} />
          ) : (
            <>
              <WalletForm
                inline
                key={q.data?.find((w) => w.primary)?.id || "primary"}
                value={
                  q.data?.find((w) => w.primary) || {
                    ...blank,
                    primary: true,
                    displayName: user?.name,
                    email: user?.email,
                  }
                }
                onSaved={() => {}}
              />
              <div className="wallet-secondary-heading">
                <h2>Carteira secundária</h2>
                <button onClick={() => setEditing({ ...blank })}>
                  Adicionar
                </button>
              </div>
              <div className="wallets-grid">
                {q.data
                  ?.filter((w) => !w.primary)
                  .map((w) => (
                    <article className="wallet-card" key={w.id}>
                      <WalletIcon size={24} />
                      <div>
                        <h2>{w.label}</h2>
                        <p>{w.address}</p>
                        <p>Rede {w.network}</p>
                        <small>
                          {w.provider}
                          {w.primary ? " · Principal" : ""}
                        </small>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => setEditing({ ...w })}
                      >
                        Editar
                      </Button>
                    </article>
                  ))}
              </div>
              {!q.data?.some((w) => !w.primary) && (
                <p className="wallet-intro">
                  Você ainda não adicionou uma carteira secundária.
                </p>
              )}
            </>
          )}
        </section>
      </div>
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
        title={editing?.id === "new" ? "Adicionar carteira" : "Editar carteira"}
      >
        {editing && (
          <WalletForm
            key={editing.id}
            value={editing}
            onSaved={() => setEditing(undefined)}
          />
        )}
      </Dialog>
    </Page>
  );
}
function WalletForm({
  value,
  onSaved,
  inline = false,
}: {
  value: Wallet;
  onSaved: () => void;
  inline?: boolean;
}) {
  const { uid } = useSession();
  const [form, setForm] = useState(value);
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({
    mutationFn: async () => api.put(`/wallets/${form.id}`, form),
    onSuccess: () => {
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ["wallets", uid] });
      onSaved();
    },
  });
  const fields = mutation.error ? errorData(mutation.error).fields : undefined;
  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }
  return (
    <form
      onSubmit={submit}
      className={`wallet-form ${inline ? "wallet-primary-form" : ""}`}
      noValidate
    >
      {inline && (
        <Field
          label="Nome de exibição"
          value={form.displayName || ""}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        />
      )}
      <Field
        label="Apelido da carteira"
        value={form.label}
        onChange={(e) => setForm({ ...form, label: e.target.value })}
        error={fields?.label}
        required
      />
      <Field
        label="Endereço da carteira"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        error={fields?.address}
        required
      />
      <label>
        Rede
        <select
          value={form.network}
          onChange={(e) =>
            setForm({ ...form, network: e.target.value as Network })
          }
        >
          {["Ethereum", "Polygon", "Solana"].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      {inline && (
        <Field
          label="Nome do perfil"
          value={form.profileName || ""}
          onChange={(e) => setForm({ ...form, profileName: e.target.value })}
        />
      )}
      {inline && (
        <Field
          label="ENS ou carteira secundária (opcional)"
          value={form.secondaryAddress || ""}
          onChange={(e) =>
            setForm({ ...form, secondaryAddress: e.target.value })
          }
        />
      )}
      <label>
        Tipo de carteira
        <select
          value={form.provider}
          onChange={(e) => setForm({ ...form, provider: e.target.value })}
        >
          {["MetaMask", "WalletConnect", "Coinbase Wallet"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      {inline && (
        <>
          <Field
            label="Código de indicação"
            value={form.referral || ""}
            onChange={(e) => setForm({ ...form, referral: e.target.value })}
          />
          <Field
            label="E-mail"
            type="email"
            value={form.email || ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={fields?.email}
          />
          <Field
            label="Nome ENS"
            placeholder="seu-nome.eth"
            value={form.ens || ""}
            onChange={(e) => setForm({ ...form, ens: e.target.value })}
          />
        </>
      )}
      {!inline && (
        <label className="flex gap-3 items-center">
          <input
            type="checkbox"
            checked={form.primary}
            onChange={(e) => setForm({ ...form, primary: e.target.checked })}
          />
          Carteira principal
        </label>
      )}
      {mutation.isError && <ErrorBox error={mutation.error} />}
      <Button type="submit" disabled={mutation.isPending}>
        Salvar carteira
      </Button>
      {saved && <p role="status">Carteira salva com sucesso.</p>}
    </form>
  );
}
export function Favorites() {
  const { uid } = useSession();
  const favorites = useQuery(favoritesQuery(uid));
  const nfts = useQuery(catalogQuery({ ...defaultSearch, page: 1 }));
  return (
    <Page account>
      <div className="account-layout">
        <AccountSidebar />
        <section>
          <h1>Lista de interesse</h1>
          {favorites.isPending || nfts.isPending ? (
            <Skeleton cards={3} />
          ) : favorites.isError ? (
            <ErrorBox error={favorites.error} />
          ) : nfts.isError ? (
            <ErrorBox error={nfts.error} />
          ) : (
            <FavoriteList ids={favorites.data || []} />
          )}
        </section>
      </div>
    </Page>
  );
}
function FavoriteList({ ids }: { ids: string[] }) {
  const q = useQuery({
    queryKey: ["favorite-nfts", ids],
    queryFn: async () =>
      Promise.all(
        ids.map((id) => get<import("../api/contracts").Nft>(`/nfts/${id}`)),
      ),
  });
  if (!ids.length)
    return (
      <Empty title="Sua lista está vazia">
        <p>Favorite obras para encontrá-las aqui.</p>
      </Empty>
    );
  if (q.isPending) return <Skeleton />;
  if (q.isError) return <ErrorBox error={q.error} />;
  return (
    <div className="nft-grid">
      {q.data.map((n) => (
        <NftCard nft={n} key={n.id} />
      ))}
    </div>
  );
}
