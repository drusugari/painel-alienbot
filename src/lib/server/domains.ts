import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  domainToRow,
  normalizeManagedDomain,
  rowToDomain,
  type ManagedDomain,
  type ManagedDomainRow
} from "@/lib/domain";

const localDomainsPath = path.join(process.cwd(), ".alienbot-domains.json");

function hasSupabase() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

function canUseLocalStore() {
  return !process.env.VERCEL;
}

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase não configurado.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function readLocalDomains() {
  try {
    const raw = await fs.readFile(localDomainsPath, "utf8");
    return JSON.parse(raw) as ManagedDomain[];
  } catch {
    return [];
  }
}

async function writeLocalDomains(domains: ManagedDomain[]) {
  await fs.writeFile(localDomainsPath, JSON.stringify(domains, null, 2), "utf8");
}

export async function listReadyDomains(): Promise<ManagedDomain[]> {
  if (!hasSupabase()) {
    if (!canUseLocalStore()) return [];
    return (await readLocalDomains())
      .filter((domain) => domain.active && domain.status === "ready")
      .sort((a, b) => a.dominio.localeCompare(b.dominio));
  }

  const { data, error } = await supabase()
    .from("domains")
    .select("*")
    .eq("active", true)
    .eq("status", "ready")
    .order("dominio", { ascending: true });

  if (error) {
    return [];
  }

  return ((data || []) as ManagedDomainRow[]).map(rowToDomain);
}

export async function saveDomain(input: Partial<ManagedDomain>) {
  const domain = normalizeManagedDomain(input);
  if (!domain.dominio) {
    throw new Error("Informe um domínio válido.");
  }

  if (!hasSupabase()) {
    if (!canUseLocalStore()) {
      throw new Error("Configure o Supabase para salvar domínios.");
    }

    const domains = await readLocalDomains();
    const now = new Date().toISOString();
    const existingIndex = domains.findIndex(
      (item) => item.id === domain.id || item.dominio === domain.dominio
    );
    const nextDomain: ManagedDomain = {
      ...domain,
      id: domain.id || domains[existingIndex]?.id || randomUUID(),
      createdAt: domains[existingIndex]?.createdAt || now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      domains[existingIndex] = nextDomain;
    } else {
      domains.unshift(nextDomain);
    }

    await writeLocalDomains(domains);
    return nextDomain;
  }

  const { data, error } = await supabase()
    .from("domains")
    .upsert(domainToRow(domain), { onConflict: "dominio" })
    .select("*")
    .single();

  if (error) {
    throw new Error(
      error.message.includes("domains")
        ? "Tabela domains não existe. Rode o schema atualizado no Supabase."
        : error.message
    );
  }

  return rowToDomain(data as ManagedDomainRow);
}

export async function deleteDomain(id: string) {
  if (!hasSupabase()) {
    if (!canUseLocalStore()) return;
    const domains = await readLocalDomains();
    await writeLocalDomains(domains.filter((domain) => domain.id !== id));
    return;
  }

  const { error } = await supabase().from("domains").delete().eq("id", id);
  if (error) throw error;
}
