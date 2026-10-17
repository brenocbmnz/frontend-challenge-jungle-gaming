import type { Collector } from "../api/contracts";

/** Shared transport validation; optional fields stay optional in both clients. */
export function validateCollector(
  collector: Partial<Collector> | undefined,
  note = "",
) {
  const fields: Record<string, string> = {};
  if (!collector?.name?.trim() || collector.name.length > 80)
    fields.name = "Informe um nome de até 80 caracteres.";
  if (
    !collector?.username?.trim() ||
    !/^[\w.-]{2,40}$/.test(collector.username)
  )
    fields.username = "Use de 2 a 40 letras, números, pontos ou traços.";
  if (
    !collector?.email ||
    !/^\S+@\S+\.\S+$/.test(collector.email) ||
    collector.email.length > 254
  )
    fields.email = "Informe um e-mail válido.";
  if (collector?.profileName && collector.profileName.length > 80)
    fields.profileName = "Use até 80 caracteres.";
  if (collector?.ens && !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*$/i.test(collector.ens))
    fields.ens = "Informe um nome ENS válido, sem espaços.";
  if (
    collector?.secondaryWallet &&
    !/^(?:0x[a-fA-F0-9]{40}|[a-z0-9.-]+\.eth|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(
      collector.secondaryWallet,
    )
  )
    fields.secondaryWallet = "Informe um endereço de carteira ou ENS válido.";
  if (
    collector?.referralCode &&
    !/^[a-z0-9_-]{1,32}$/i.test(collector.referralCode)
  )
    fields.referralCode = "Use até 32 letras, números, traços ou sublinhados.";
  if (note.length > 500) fields.note = "Use até 500 caracteres.";
  return fields;
}
