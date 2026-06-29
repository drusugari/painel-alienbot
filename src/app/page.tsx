import { headers } from "next/headers";
import { SiteGeneratorPanel } from "@/components/SiteGeneratorPanel";
import { SiteTemplate } from "@/components/SiteTemplate";
import { normalizeDomain, type Site } from "@/lib/site";
import { findSiteByHost, getStorageMode, listSites } from "@/lib/server/sites";

function getAvailableDomains(sites: Site[]) {
  const envDomains = [
    process.env.SITE_DOMAINS || "",
    process.env.NEXT_PUBLIC_SITE_DOMAINS || ""
  ]
    .join(",")
    .split(/[,\n]/)
    .map(normalizeDomain)
    .filter(Boolean);

  return Array.from(
    new Set([...envDomains, ...sites.map((site) => normalizeDomain(site.dominio))])
  ).sort();
}

export default async function HomePage() {
  const host = headers().get("host") || "";
  const hostSite = await findSiteByHost(host);

  if (hostSite) {
    return <SiteTemplate site={hostSite} />;
  }

  const sites = await listSites();
  return (
    <SiteGeneratorPanel
      initialSites={sites}
      storageMode={getStorageMode()}
      availableDomains={getAvailableDomains(sites)}
    />
  );
}
