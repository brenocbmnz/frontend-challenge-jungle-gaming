import { useState } from "react";
import axios from "axios";
import type { Scenario } from "../api/contracts";
import { Page } from "../components/layout";
import { Button } from "../components/ui/button";
import { queryClient } from "../api/queries";
const scenarios: Scenario[] = [
  "default",
  "empty",
  "slow",
  "out-of-order",
  "offline",
  "server-error",
  "expired",
  "favorite-error",
  "price-change",
  "sold-out",
  "order-timeout",
  "payment-refused",
  "wallet-refused",
];
export function Demo() {
  const [scenario, setScenario] = useState<Scenario>("default");
  const [message, setMessage] = useState("");
  async function event(type: string) {
    await axios.post("/__mock/event", {
      type,
      id: "1",
      duplicate: true,
      stale: true,
    });
    setMessage("Evento enviado pelo transporte Socket.IO.");
  }
  return (
    <Page>
      <section className="demo-panel">
        <h1>Cenários da demonstração</h1>
        <p>
          Controles de avaliação para a API simulada e o transporte Socket.IO.
        </p>
        <label>
          Cenário
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value as Scenario)}
          >
            {scenarios.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <Button
          onClick={async () => {
            await axios.post("/__mock/scenario", { scenario });
            await queryClient.invalidateQueries();
            setMessage("Cenário ativado.");
          }}
        >
          Aplicar cenário
        </Button>
        <div className="flex flex-wrap gap-3 my-5">
          {[
            ["price", "Alterar preço"],
            ["sold-out", "Esgotar NFT"],
            ["disconnect", "Interromper conexão"],
            ["expire", "Expirar sessão"],
          ].map(([type, label]) => (
            <Button
              key={type}
              variant="outline"
              onClick={() => void event(type)}
            >
              {label}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await axios.post("/__mock/reset", { scenario });
            localStorage.removeItem("kurio.token");
            sessionStorage.clear();
            location.href = "/";
          }}
        >
          Resetar todos os dados
        </Button>
        <p role="status">{message}</p>
      </section>
    </Page>
  );
}
