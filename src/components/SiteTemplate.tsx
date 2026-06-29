import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { CSSProperties } from "react";
import type { Site, SitePage } from "@/lib/site";
import { resolveTheme } from "@/lib/variants";

type SiteTemplateProps = {
  site: Site;
  page?: SitePage;
  previewBase?: string;
};

function cityState(site: Site) {
  return [site.cidade, site.estado].filter(Boolean).join(" - ");
}

function whatsappUrl(site: Site) {
  const digits = site.whatsapp || site.telefone;
  return digits ? `https://wa.me/55${digits.replace(/^55/, "")}` : "#contato";
}

function phoneUrl(site: Site) {
  const digits = site.telefone || site.whatsapp;
  return digits ? `tel:+55${digits.replace(/^55/, "")}` : "#contato";
}

function pageHref(base: string, page: SitePage) {
  if (page === "home") return base || "/";
  return `${base}/${page}`.replace("//", "/");
}

function Logo({ name }: { name: string }) {
  return <div className="gdl-logo">{name.trim().charAt(0).toUpperCase() || "A"}</div>;
}

function LegalContent({ site, page }: { site: Site; page: SitePage }) {
  if (page === "politica-de-privacidade") {
    return (
      <section className="gdl-section">
        <div className="gdl-container">
          <h1 className="gdl-page-title">Política de Privacidade</h1>
          <div className="gdl-info-box">
            <p>
              A <strong>{site.nomeFantasia || site.razaoSocial}</strong>, inscrita no
              CNPJ <strong>{site.cnpj}</strong>, respeita a sua privacidade e está
              comprometida com a proteção dos dados pessoais dos usuários.
            </p>
            <p className="mt-4">
              As informações enviadas por este site são utilizadas exclusivamente
              para atendimento, comunicação e melhoria dos serviços prestados, em
              conformidade com a Lei Geral de Proteção de Dados.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="gdl-section">
      <div className="gdl-container">
        <h1 className="gdl-page-title">Termos de Uso</h1>
        <div className="gdl-info-box">
          <p>
            O acesso a este site implica na aceitação dos presentes Termos de Uso.
            A <strong>{site.nomeFantasia || site.razaoSocial}</strong> atua no
            segmento de <strong>{site.atividadePrincipal || "serviços profissionais"}</strong>.
          </p>
          <p className="mt-4">
            Todo o conteúdo deste site é protegido por direitos autorais, sendo
            proibida a reprodução sem autorização prévia.
          </p>
        </div>
      </div>
    </section>
  );
}

function Cards({ site, only }: { site: Site; only?: "empresa" | "atuacao" | "contato" }) {
  const showEmpresa = !only || only === "empresa";
  const showAtuacao = !only || only === "atuacao";
  const showContato = !only || only === "contato";

  return (
    <section className="gdl-section">
      <div className="gdl-container">
        <div className="gdl-grid-3">
          {showEmpresa ? (
            <div id="empresa" className="gdl-card">
              <h3>Quem somos</h3>
              <p>
                A empresa <strong>{site.razaoSocial}</strong> atua com{" "}
                <strong>{site.atividadePrincipal || "serviços profissionais"}</strong>.
                {site.descricao ? ` ${site.descricao}` : ""}
              </p>
            </div>
          ) : null}

          {showAtuacao ? (
            <div id="atuacao" className="gdl-card">
              <h3>O que fazemos</h3>
              <ul className="gdl-list">
                <li>{site.atividadePrincipal || site.nomeFantasia}</li>
                <li>Atendimento profissional</li>
                <li>Qualidade e confiança</li>
                <li>Suporte e agilidade</li>
              </ul>
            </div>
          ) : null}

          {showContato ? (
            <div id="contato" className="gdl-card">
              <h3>Contato</h3>
              <div className="gdl-contact">
                {site.telefone ? (
                  <a href={phoneUrl(site)}>
                    <span className="gdl-ic">
                      <Phone size={15} />
                    </span>
                    <span>+55 {site.telefone.replace(/^55/, "")}</span>
                  </a>
                ) : null}
                <a href={whatsappUrl(site)} target="_blank" rel="noopener">
                  <span className="gdl-ic">
                    <MessageCircle size={15} />
                  </span>
                  Chamar no WhatsApp
                </a>
                {site.email ? (
                  <a href={`mailto:${site.email}`}>
                    <span className="gdl-ic">
                      <Mail size={15} />
                    </span>
                    <span>{site.email}</span>
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function OfficialData({ site }: { site: Site }) {
  return (
    <section className="gdl-soft">
      <div className="gdl-container">
        <h2>Dados Oficiais</h2>
        <div className="gdl-info-box">
          <div className="gdl-info-grid">
            <div className="gdl-info-item">
              <small>Razão Social</small>
              <div>{site.razaoSocial}</div>
            </div>
            <div className="gdl-info-item">
              <small>CNPJ</small>
              <div>{site.cnpj}</div>
            </div>
            <div className="gdl-info-item">
              <small>Cidade</small>
              <div>{cityState(site) || "Atendimento nacional"}</div>
            </div>
            <div className="gdl-info-item">
              <small>Atividade Principal</small>
              <div>{site.atividadePrincipal || "Serviços profissionais"}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteTemplate({ site, page = "home", previewBase = "" }: SiteTemplateProps) {
  const theme = resolveTheme(site.themeId);
  const name = site.nomeFantasia || site.razaoSocial;
  const location = cityState(site);
  const isLegal =
    page === "politica-de-privacidade" || page === "termos-de-uso";

  return (
    <main
      className={[
        "gdl-site",
        `gdl-header-${theme.header}`,
        `gdl-card-${theme.card}`,
        `gdl-footer-${theme.footer}`,
        `gdl-button-${theme.button}`,
        `gdl-border-${theme.border}`
      ].join(" ")}
      style={{
        ...theme.style,
        "--hero-image": `url("${theme.heroImage}")`
      } as CSSProperties}
    >
      <div className="gdl-topbar">
        <div className="gdl-container">
          <div className="gdl-topbar-inner">
            <a className="gdl-brand" href={pageHref(previewBase, "home")}>
              <Logo name={name} />
              <div className="gdl-brand-text">
                <strong>{name}</strong>
                <span>Atendimento profissional</span>
              </div>
            </a>
            <nav className="gdl-nav" aria-label="Menu principal">
              <a href={pageHref(previewBase, "home")}>Home</a>
              <a href={pageHref(previewBase, "empresa")}>Empresa</a>
              <a href={pageHref(previewBase, "atuacao")}>Atuação</a>
              <a className="gdl-btn gdl-btn-primary" href={pageHref(previewBase, "contato")}>
                Contato
              </a>
            </nav>
          </div>
        </div>
      </div>

      {!isLegal ? (
        <section id="home" className="gdl-hero">
          <div className="gdl-container">
            <h1>{site.atividadePrincipal || "Serviços profissionais"}</h1>
            <p>
              Atendimento profissional{location ? ` em ${location}` : ""}.
              Qualidade e confiança.
            </p>
            <div className="gdl-hero-cta">
              <a className="gdl-btn gdl-btn-light" href={pageHref(previewBase, "atuacao")}>
                Ver Serviços
              </a>
              <a
                className="gdl-btn gdl-btn-outline"
                href={whatsappUrl(site)}
                target="_blank"
                rel="noopener"
              >
                Chamar no WhatsApp
              </a>
            </div>
          </div>
        </section>
      ) : null}

      {page === "home" ? (
        <>
          <Cards site={site} />
          <OfficialData site={site} />
        </>
      ) : null}
      {page === "empresa" ? (
        <>
          <Cards site={site} only="empresa" />
          <OfficialData site={site} />
        </>
      ) : null}
      {page === "atuacao" ? <Cards site={site} only="atuacao" /> : null}
      {page === "contato" ? (
        <>
          <Cards site={site} only="contato" />
          <section className="gdl-soft">
            <div className="gdl-container">
              <h2>Localização</h2>
              <div className="gdl-info-box">
                <div className="gdl-contact">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className="gdl-ic">
                      <MapPin size={15} />
                    </span>
                    {location || "Atendimento nacional"}
                    {site.cep ? ` - CEP ${site.cep}` : ""}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
      {isLegal ? <LegalContent site={site} page={page} /> : null}

      <footer className="gdl-footer">
        <div className="gdl-container">
          <div className="gdl-footer-inner">
            <div>
              <div className="gdl-foot-title">{name}</div>
              <div className="gdl-foot-muted">
                CNPJ: {site.cnpj}
                <br />© {new Date().getFullYear()} Todos os direitos reservados.
              </div>
            </div>
            <div className="gdl-foot-links">
              <a href={pageHref(previewBase, "politica-de-privacidade")}>
                Política de Privacidade
              </a>
              <a href={pageHref(previewBase, "termos-de-uso")}>Termos de Uso</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
