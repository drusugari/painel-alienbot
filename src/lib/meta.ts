import type { Metadata } from "next";
import { makePublicUrl, type Site, type SitePage } from "@/lib/site";

type ParsedMetaTag = {
  key: string;
  content: string;
};

export function siteTitle(site: Site, page: SitePage = "home") {
  const base = site.nomeFantasia || site.razaoSocial;
  const labels: Record<SitePage, string> = {
    home: "Atendimento profissional",
    empresa: "Empresa",
    atuacao: "Atuação",
    contato: "Contato",
    "politica-de-privacidade": "Política de Privacidade",
    "termos-de-uso": "Termos de Uso"
  };
  return `${base} | ${labels[page]}`;
}

export function siteDescription(site: Site) {
  const activity = site.atividadePrincipal || "Serviços profissionais";
  const city = [site.cidade, site.estado].filter(Boolean).join(" - ");
  return `${activity}${city ? ` em ${city}` : ""}. CNPJ ${site.cnpj}. Atendimento profissional com qualidade e confiança.`;
}

export function parseMetaTag(metaTag: string): ParsedMetaTag | null {
  const tag = metaTag.trim();
  if (!tag) return null;

  const name =
    tag.match(/\sname=["']([^"']+)["']/i)?.[1] ||
    tag.match(/\sproperty=["']([^"']+)["']/i)?.[1];
  const content = tag.match(/\scontent=["']([^"']+)["']/i)?.[1];

  if (!name || !content) return null;
  return { key: name, content };
}

export function buildSiteMetadata(site: Site, page: SitePage = "home"): Metadata {
  const title = siteTitle(site, page);
  const description = siteDescription(site);
  const parsedMetaTag = parseMetaTag(site.metaTag);
  const url = makePublicUrl(site.slug, site.dominio, page);

  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title,
      description,
      url: url || undefined,
      type: "website",
      siteName: site.nomeFantasia || site.razaoSocial,
      locale: "pt_BR"
    },
    other: {
      empresa: site.nomeFantasia || site.razaoSocial,
      cnpj: site.cnpj,
      cidade: site.cidade,
      atividade: site.atividadePrincipal,
      ...(parsedMetaTag ? { [parsedMetaTag.key]: parsedMetaTag.content } : {})
    }
  };
}
