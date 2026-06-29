import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  hashToThemeId,
  makeFullDomain,
  normalizeSite,
  ROOT_DOMAIN_SLUG,
  rowToSite,
  siteToRow,
  slugify,
  type Site,
  type SiteRow
} from "@/lib/site";

const localStorePath = path.join(process.cwd(), ".alienbot-sites.json");

export type StorageMode = "supabase" | "local" | "vercel-missing-supabase";

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

function assertPersistentStorage() {
  if (!hasSupabase() && !canUseLocalStore()) {
    throw new Error(
      "Configure o Supabase nas variáveis de ambiente da Vercel antes de publicar sites."
    );
  }
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

async function readLocalSites() {
  try {
    const raw = await fs.readFile(localStorePath, "utf8");
    return JSON.parse(raw) as Site[];
  } catch {
    return [];
  }
}

async function writeLocalSites(sites: Site[]) {
  await fs.writeFile(localStorePath, JSON.stringify(sites, null, 2), "utf8");
}

export function isSupabaseConfigured() {
  return hasSupabase();
}

export function getStorageMode(): StorageMode {
  if (hasSupabase()) return "supabase";
  return canUseLocalStore() ? "local" : "vercel-missing-supabase";
}

export async function listSites(): Promise<Site[]> {
  if (!hasSupabase()) {
    if (!canUseLocalStore()) return [];
    return (await readLocalSites()).sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );
  }

  const { data, error } = await supabase()
    .from("sites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data || []) as SiteRow[]).map(rowToSite);
}

export async function saveSite(input: Partial<Site>): Promise<Site> {
  const site = normalizeSite(input);

  if (!site.cnpj || site.cnpj.length < 18) {
    throw new Error("Informe um CNPJ válido.");
  }
  if (!site.razaoSocial) {
    throw new Error("Informe a razão social.");
  }
  if (!site.slug || !site.dominio || !site.fullDomain) {
    throw new Error("Informe slug e domínio.");
  }

  if (!hasSupabase()) {
    assertPersistentStorage();
    const sites = await readLocalSites();
    const now = new Date().toISOString();
    const existingIndex = sites.findIndex(
      (item) => item.id === site.id || item.fullDomain === site.fullDomain
    );
    const nextSite: Site = {
      ...site,
      id: site.id || sites[existingIndex]?.id || randomUUID(),
      createdAt: sites[existingIndex]?.createdAt || now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      sites[existingIndex] = nextSite;
    } else {
      sites.unshift(nextSite);
    }

    await writeLocalSites(sites);
    return nextSite;
  }

  const row = siteToRow(site);
  const { data, error } = await supabase()
    .from("sites")
    .upsert(row, { onConflict: "full_domain" })
    .select("*")
    .single();

  if (error) throw error;
  return rowToSite(data as SiteRow);
}

export async function findSiteBySlug(slug: string): Promise<Site | null> {
  const cleanSlug = slugify(slug);
  if (!cleanSlug) return null;

  if (!hasSupabase()) {
    if (!canUseLocalStore()) return null;
    return (await readLocalSites()).find((site) => site.slug === cleanSlug) || null;
  }

  const { data, error } = await supabase()
    .from("sites")
    .select("*")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToSite(data as SiteRow) : null;
}

export async function findSiteByHost(host: string): Promise<Site | null> {
  const cleanHost = host.split(":")[0]?.toLowerCase() || "";
  if (!cleanHost || cleanHost === "localhost" || cleanHost === "127.0.0.1") {
    return null;
  }
  const hostCandidates = Array.from(
    new Set([cleanHost, cleanHost.replace(/^www\./, "")].filter(Boolean))
  );

  if (!hasSupabase()) {
    if (!canUseLocalStore()) return null;
    return (
      (await readLocalSites()).find((site) =>
        hostCandidates.includes(site.fullDomain)
      ) || null
    );
  }

  const { data, error } = await supabase()
    .from("sites")
    .select("*")
    .in("full_domain", hostCandidates)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToSite(data as SiteRow) : null;
}

export async function deleteSite(id: string) {
  if (!hasSupabase()) {
    assertPersistentStorage();
    const sites = await readLocalSites();
    await writeLocalSites(sites.filter((site) => site.id !== id));
    return;
  }

  const { error } = await supabase().from("sites").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateSite(id: string): Promise<Site> {
  assertPersistentStorage();
  const sites = await listSites();
  const source = sites.find((site) => site.id === id);
  if (!source) throw new Error("Site não encontrado.");

  let index = 2;
  const baseSlug =
    source.slug === ROOT_DOMAIN_SLUG
      ? slugify(source.nomeFantasia || source.razaoSocial || "site")
      : source.slug;
  let nextSlug = `${baseSlug || "site"}-copia`;
  while (sites.some((site) => site.slug === nextSlug && site.dominio === source.dominio)) {
    nextSlug = `${baseSlug || "site"}-copia-${index}`;
    index += 1;
  }

  const fullDomain = makeFullDomain(nextSlug, source.dominio);
  return saveSite({
    ...source,
    id: undefined,
    slug: nextSlug,
    fullDomain,
    themeId: hashToThemeId(`${nextSlug}|${source.dominio}|${source.cnpj}`)
  });
}
