import { headers } from "next/headers";
import { SiteGeneratorPanel } from "@/components/SiteGeneratorPanel";
import { SiteTemplate } from "@/components/SiteTemplate";
import { findSiteByHost, getStorageMode, listSites } from "@/lib/server/sites";

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
    />
  );
}
