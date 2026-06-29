import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { SiteTemplate } from "@/components/SiteTemplate";
import { buildSiteMetadata } from "@/lib/meta";
import { SITE_PAGES, type SitePage } from "@/lib/site";
import { findSiteByHost, findSiteBySlugForHost } from "@/lib/server/sites";

type CatchAllProps = {
  params: { segments?: string[] };
};

async function resolveRequest(segments: string[] = []) {
  const host = headers().get("host") || "";
  const hostSite = await findSiteByHost(host);

  if (hostSite) {
    const page = (segments[0] || "home") as SitePage;
    return SITE_PAGES.includes(page) ? { site: hostSite, page, previewBase: "" } : null;
  }

  const [slug, maybePage] = segments;
  if (!slug) return null;
  const site = await findSiteBySlugForHost(slug, host);
  if (!site) return null;

  const page = (maybePage || "home") as SitePage;
  if (!SITE_PAGES.includes(page)) return null;

  return { site, page, previewBase: `/${site.slug}` };
}

export async function generateMetadata({ params }: CatchAllProps): Promise<Metadata> {
  const resolved = await resolveRequest(params.segments);
  if (!resolved) return {};
  return buildSiteMetadata(resolved.site, resolved.page);
}

export default async function CatchAllPage({ params }: CatchAllProps) {
  const resolved = await resolveRequest(params.segments);
  if (!resolved) notFound();

  return (
    <SiteTemplate
      site={resolved.site}
      page={resolved.page}
      previewBase={resolved.previewBase}
    />
  );
}
