export type SitePage =
  | "home"
  | "empresa"
  | "atuacao"
  | "contato"
  | "politica-de-privacidade"
  | "termos-de-uso";

export type Site = {
  id?: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  descricao: string;
  telefone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  facebook: string;
  cidade: string;
  estado: string;
  cep: string;
  atividadePrincipal: string;
  slug: string;
  dominio: string;
  fullDomain: string;
  metaTag: string;
  themeId: number;
  createdAt?: string;
  updatedAt?: string;
};

export type BrasilApiCompany = {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  descricao_situacao_cadastral?: string;
  cnae_fiscal?: number | string;
  cnae_fiscal_descricao?: string;
  ddd_telefone_1?: string;
  email?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
};

export type SiteRow = {
  id?: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  descricao: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  atividade_principal: string | null;
  slug: string;
  dominio: string;
  full_domain: string;
  meta_tag: string | null;
  theme_id: number;
  created_at?: string;
  updated_at?: string;
};

export const ROOT_DOMAIN_SLUG = "@";

export const SITE_PAGES: SitePage[] = [
  "home",
  "empresa",
  "atuacao",
  "contato",
  "politica-de-privacidade",
  "termos-de-uso"
];

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function maskCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function isRootDomainSlug(value?: string) {
  return (value || "").trim() === ROOT_DOMAIN_SLUG;
}

export function normalizeDomain(value: string) {
  return value
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .trim()
    .toLowerCase();
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b([a-záàâãéèêíïóôõöúçñ])/gi, (letter) =>
      letter.toUpperCase()
    );
}

export function makeFullDomain(slug: string, dominio: string) {
  const cleanDomain = normalizeDomain(dominio);
  if (isRootDomainSlug(slug)) return cleanDomain;

  const cleanSlug = slugify(slug);
  return cleanSlug && cleanDomain ? `${cleanSlug}.${cleanDomain}` : "";
}

export function hashToThemeId(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash % 100000;
}

export function normalizeSite(input: Partial<Site>): Site {
  const rawSlug = (input.slug || "").trim();
  const slug = isRootDomainSlug(rawSlug)
    ? ROOT_DOMAIN_SLUG
    : slugify(rawSlug || input.nomeFantasia || input.razaoSocial || "");
  const dominio = normalizeDomain(input.dominio || "");
  const fullDomain = makeFullDomain(slug, dominio);
  const razaoSocial = (input.razaoSocial || "").trim();
  const nomeFantasia = (input.nomeFantasia || razaoSocial).trim();
  const cnpj = maskCnpj(input.cnpj || "");
  const themeId =
    typeof input.themeId === "number" && Number.isFinite(input.themeId)
      ? input.themeId
      : hashToThemeId(`${slug}|${dominio}|${cnpj}`);

  return {
    id: input.id,
    cnpj,
    razaoSocial,
    nomeFantasia,
    descricao: (input.descricao || "").trim(),
    telefone: onlyDigits(input.telefone || ""),
    whatsapp: onlyDigits(input.whatsapp || input.telefone || ""),
    email: (input.email || "").trim().toLowerCase(),
    instagram: (input.instagram || "").trim(),
    facebook: (input.facebook || "").trim(),
    cidade: titleCase((input.cidade || "").trim()),
    estado: (input.estado || "").trim().toUpperCase(),
    cep: (input.cep || "").trim(),
    atividadePrincipal: (input.atividadePrincipal || "").trim(),
    slug,
    dominio,
    fullDomain,
    metaTag: (input.metaTag || "").trim(),
    themeId,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt
  };
}

export function siteToRow(site: Site): SiteRow {
  return {
    id: site.id,
    cnpj: site.cnpj,
    razao_social: site.razaoSocial,
    nome_fantasia: site.nomeFantasia || null,
    descricao: site.descricao || null,
    telefone: site.telefone || null,
    whatsapp: site.whatsapp || null,
    email: site.email || null,
    instagram: site.instagram || null,
    facebook: site.facebook || null,
    cidade: site.cidade || null,
    estado: site.estado || null,
    cep: site.cep || null,
    atividade_principal: site.atividadePrincipal || null,
    slug: site.slug,
    dominio: site.dominio,
    full_domain: site.fullDomain,
    meta_tag: site.metaTag || null,
    theme_id: site.themeId
  };
}

export function rowToSite(row: SiteRow): Site {
  return {
    id: row.id,
    cnpj: row.cnpj,
    razaoSocial: row.razao_social,
    nomeFantasia: row.nome_fantasia || row.razao_social,
    descricao: row.descricao || "",
    telefone: row.telefone || "",
    whatsapp: row.whatsapp || row.telefone || "",
    email: row.email || "",
    instagram: row.instagram || "",
    facebook: row.facebook || "",
    cidade: row.cidade || "",
    estado: row.estado || "",
    cep: row.cep || "",
    atividadePrincipal: row.atividade_principal || "",
    slug: row.slug,
    dominio: row.dominio,
    fullDomain: row.full_domain,
    metaTag: row.meta_tag || "",
    themeId: row.theme_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
