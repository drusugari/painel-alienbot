"use client";

import {
  Copy,
  Eye,
  FilePlus2,
  Globe2,
  Loader2,
  Pencil,
  RefreshCcw,
  Send,
  Trash2,
  X
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  hashToThemeId,
  makeFullDomain,
  maskCnpj,
  normalizeSite,
  onlyDigits,
  slugify,
  titleCase,
  type BrasilApiCompany,
  type Site
} from "@/lib/site";
import type { StorageMode } from "@/lib/server/sites";

const emptySite: Site = normalizeSite({
  cnpj: "",
  razaoSocial: "",
  nomeFantasia: "",
  descricao: "",
  telefone: "",
  whatsapp: "",
  email: "",
  instagram: "",
  facebook: "",
  cidade: "",
  estado: "",
  cep: "",
  atividadePrincipal: "",
  slug: "",
  dominio: "",
  metaTag: ""
});

function activityFromBrasilApi(data: BrasilApiCompany) {
  if (!data.cnae_fiscal_descricao) return "";
  return [data.cnae_fiscal, data.cnae_fiscal_descricao].filter(Boolean).join(" - ");
}

function fieldLabel(key: keyof Site) {
  const labels: Partial<Record<keyof Site, string>> = {
    razaoSocial: "Razão Social",
    nomeFantasia: "Nome Fantasia",
    descricao: "Descrição",
    telefone: "Telefone",
    cidade: "Cidade",
    estado: "Estado",
    cep: "CEP",
    atividadePrincipal: "Atividade principal",
    email: "Email",
    instagram: "Instagram",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    slug: "Slug",
    dominio: "Domínio",
    metaTag: "Meta Tag"
  };
  return labels[key] || key;
}

async function fetchCnpjData(digits: string) {
  const serverResponse = await fetch(`/api/cnpj/${digits}`, { cache: "no-store" });
  const serverData = (await serverResponse.json()) as BrasilApiCompany & {
    error?: string;
  };

  if (serverResponse.ok) return serverData;

  try {
    const directResponse = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
      { cache: "no-store" }
    );
    if (directResponse.ok) {
      return (await directResponse.json()) as BrasilApiCompany;
    }
  } catch {
    // The backend already tried multiple providers; this is just a browser-side rescue.
  }

  throw new Error(
    serverData.error ||
      "Não consegui consultar esse CNPJ agora. Preencha manualmente ou tente novamente."
  );
}

export function SiteGeneratorPanel({
  initialSites,
  storageMode
}: {
  initialSites: Site[];
  storageMode: StorageMode;
}) {
  const [form, setForm] = useState<Site>(emptySite);
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fullDomain = useMemo(
    () => makeFullDomain(form.slug, form.dominio),
    [form.slug, form.dominio]
  );
  const missingSupabaseOnVercel = storageMode === "vercel-missing-supabase";
  const storageLabel =
    storageMode === "supabase"
      ? "Supabase"
      : storageMode === "local"
        ? "local dev"
        : "Supabase pendente";
  const isEditing = Boolean(form.id);

  useEffect(() => {
    setSites(initialSites);
  }, [initialSites]);

  function update<K extends keyof Site>(key: K, value: Site[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "slug" || key === "dominio") {
        next.fullDomain = makeFullDomain(
          key === "slug" ? String(value) : next.slug,
          key === "dominio" ? String(value) : next.dominio
        );
      }
      return next;
    });
  }

  async function refreshSites() {
    const response = await fetch("/api/sites", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setSites(data.sites || []);
  }

  async function generateData() {
    const digits = onlyDigits(form.cnpj);
    if (digits.length !== 14) {
      setMessage("Digite um CNPJ válido com 14 números.");
      return;
    }

    setLoadingCnpj(true);
    setMessage("");

    try {
      const data = await fetchCnpjData(digits);

      const razaoSocial = data.razao_social || "";
      const nomeFantasia = data.nome_fantasia || razaoSocial;
      const nextSlug = form.slug || slugify(nomeFantasia || razaoSocial);
      const telefone = onlyDigits(data.ddd_telefone_1 || "");
      const atividadePrincipal = activityFromBrasilApi(data);
      const next = normalizeSite({
        ...form,
        cnpj: data.cnpj ? maskCnpj(data.cnpj) : maskCnpj(digits),
        razaoSocial,
        nomeFantasia,
        descricao:
          form.descricao ||
          `Atendimento profissional em ${titleCase(data.municipio || "")}${
            data.uf ? ` - ${data.uf}` : ""
          }.`,
        telefone,
        whatsapp: telefone,
        email: data.email || "",
        cidade: data.municipio || "",
        estado: data.uf || "",
        cep: data.cep || "",
        atividadePrincipal,
        slug: nextSlug,
        themeId: hashToThemeId(`${nextSlug}|${form.dominio}|${digits}`)
      });

      setForm(next);
      setMessage("Dados preenchidos. Revise e publique.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao buscar CNPJ.");
    } finally {
      setLoadingCnpj(false);
    }
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = normalizeSite({
        ...form,
        fullDomain,
        themeId: form.themeId || hashToThemeId(`${form.slug}|${form.dominio}|${form.cnpj}`)
      });
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não consegui publicar.");
      setForm(data.site);
      await refreshSites();
      setMessage(
        isEditing
          ? `Alterações salvas: ${data.site.fullDomain}`
          : `Publicado: ${data.site.fullDomain}`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao publicar.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(site: Site) {
    if (!site.id) return;
    const response = await fetch(`/api/sites/${site.id}`, { method: "DELETE" });
    if (response.ok) {
      setSites((current) => current.filter((item) => item.id !== site.id));
      if (form.id === site.id) setForm(emptySite);
      setMessage("Site excluído.");
    }
  }

  function editSite(site: Site) {
    setForm(site);
    setMessage(
      "Editando site publicado. Altere domínio, dados ou Meta Tag e clique em SALVAR ALTERAÇÕES."
    );
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function newSite() {
    setForm(emptySite);
    setMessage("Novo site. Digite o CNPJ para gerar os dados.");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function duplicate(site: Site) {
    if (!site.id) return;
    const response = await fetch(`/api/sites/${site.id}/duplicate`, {
      method: "POST"
    });
    const data = await response.json();
    if (response.ok) {
      await refreshSites();
      setMessage(`Duplicado: ${data.site.fullDomain}`);
    } else {
      setMessage(data.error || "Não consegui duplicar.");
    }
  }

  const textFields: (keyof Site)[] = [
    "razaoSocial",
    "nomeFantasia",
    "descricao",
    "telefone",
    "cidade",
    "estado",
    "cep",
    "atividadePrincipal",
    "email",
    "instagram",
    "facebook",
    "whatsapp"
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,.18),transparent_30%),#070b12] text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
              Alienbot MVP
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-white md:text-4xl">
              Gerador de site por CNPJ
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Gere, publique, edite metatag depois e administre todos os sites
              em um só lugar.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            Armazenamento:{" "}
            <span className="font-bold text-emerald-300">
              {storageLabel}
            </span>
          </div>
        </header>

        {missingSupabaseOnVercel ? (
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            Configure `NEXT_PUBLIC_SUPABASE_URL`,
            `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY` na
            Vercel para salvar/publicar sites.
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <form
            onSubmit={publish}
            className="rounded-lg border border-white/10 bg-panel-card p-5 shadow-glow"
          >
            <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-white">
                  {isEditing ? "Editando site publicado" : "Novo site"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {isEditing
                    ? "Cole a Meta Tag, ajuste dados ou domínio e salve sem recriar o site."
                    : "Digite o CNPJ, revise os dados e publique rápido."}
                </p>
              </div>
              {isEditing ? (
                <button
                  type="button"
                  onClick={newSite}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-bold text-slate-200 hover:bg-white/5"
                >
                  <X size={16} />
                  Novo site
                </button>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase text-slate-400">CNPJ</span>
                <input
                  value={form.cnpj}
                  onChange={(event) => update("cnpj", maskCnpj(event.target.value))}
                  placeholder="00.000.000/0000-00"
                  className="h-12 rounded-lg border border-white/10 bg-white/5 px-4 text-white outline-none ring-emerald-300/30 transition focus:ring-4"
                />
              </label>
              <button
                type="button"
                onClick={generateData}
                disabled={loadingCnpj}
                className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingCnpj ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
                GERAR DADOS
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {textFields.map((key) => (
                <label
                  key={key}
                  className={
                    key === "descricao" || key === "atividadePrincipal"
                      ? "grid gap-2 md:col-span-2"
                      : "grid gap-2"
                  }
                >
                  <span className="text-xs font-bold uppercase text-slate-400">
                    {fieldLabel(key)}
                  </span>
                  {key === "descricao" || key === "atividadePrincipal" ? (
                    <textarea
                      value={String(form[key] || "")}
                      onChange={(event) => update(key, event.target.value as Site[typeof key])}
                      rows={3}
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-emerald-300/30 transition focus:ring-4"
                    />
                  ) : (
                    <input
                      value={String(form[key] || "")}
                      onChange={(event) => update(key, event.target.value as Site[typeof key])}
                      className="h-11 rounded-lg border border-white/10 bg-white/5 px-4 text-white outline-none ring-emerald-300/30 transition focus:ring-4"
                    />
                  )}
                </label>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase text-slate-400">Slug</span>
                <input
                  value={form.slug}
                  onChange={(event) => update("slug", slugify(event.target.value))}
                  placeholder="empresa01"
                  className="h-11 rounded-lg border border-white/10 bg-white/5 px-4 text-white outline-none ring-emerald-300/30 transition focus:ring-4"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase text-slate-400">Domínio</span>
                <input
                  value={form.dominio}
                  onChange={(event) => update("dominio", event.target.value)}
                  placeholder="empresa.com.br"
                  className="h-11 rounded-lg border border-white/10 bg-white/5 px-4 text-white outline-none ring-emerald-300/30 transition focus:ring-4"
                />
              </label>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-xs font-bold uppercase text-slate-400">
                Meta Tag
              </span>
              <textarea
                value={form.metaTag}
                onChange={(event) => update("metaTag", event.target.value)}
                placeholder='<meta name="facebook-domain-verification" content="..." />'
                rows={2}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-emerald-300/30 transition focus:ring-4"
              />
            </label>

            <div className="mt-5 flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500">
                  Resultado final
                </span>
                <p className="mt-1 font-mono text-sm text-emerald-300">
                  {fullDomain || "slug.dominio.com.br"}
                </p>
              </div>
              <button
                type="submit"
                disabled={saving || missingSupabaseOnVercel}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {isEditing ? "SALVAR ALTERAÇÕES" : "PUBLICAR"}
              </button>
            </div>

            {message ? (
              <p className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                {message}
              </p>
            ) : null}
          </form>

          <aside className="rounded-lg border border-white/10 bg-panel-card p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-400 text-slate-950">
                <FilePlus2 size={20} />
              </div>
              <div>
                <h2 className="font-black text-white">Variações automáticas</h2>
                <p className="text-sm text-slate-400">Salvas no themeId do site.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-slate-300">
              <p className="rounded-lg bg-white/5 p-3">
                Paleta, imagem do hero, fonte, botões, header, cards, footer e bordas
                são escolhidos a partir do slug + domínio + CNPJ.
              </p>
              <p className="rounded-lg bg-white/5 p-3">
                O visual não muda a cada refresh: Meta, Google e usuário sempre veem
                o mesmo layout daquele site.
              </p>
              <p className="rounded-lg bg-white/5 p-3">
                Preview local: <span className="font-mono text-emerald-300">/{form.slug || "empresa01"}</span>
              </p>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-sky-400 text-slate-950">
                  <Globe2 size={20} />
                </div>
                <div>
                  <h2 className="font-black text-white">Domínios</h2>
                  <p className="text-sm text-slate-400">Cloudflare é opcional.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-300">
                <p className="rounded-lg bg-white/5 p-3">
                  Mais prático: usar Cloudflare para DNS e apontar wildcard{" "}
                  <span className="font-mono text-sky-200">*.seudominio.com.br</span>{" "}
                  para a Vercel.
                </p>
                <p className="rounded-lg bg-white/5 p-3">
                  Sem Cloudflare também funciona, desde que seu registrador permita
                  criar o wildcard no DNS.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-lg border border-white/10 bg-panel-card">
          <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Painel de sites</h2>
              <p className="text-sm text-slate-400">
                Publique primeiro, depois clique em Editar para colar Meta Tag ou
                alterar dados.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshSites}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-bold text-slate-200 hover:bg-white/5"
            >
              <RefreshCcw size={16} />
              Atualizar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Empresa</th>
                  <th className="px-5 py-3">CNPJ</th>
                  <th className="px-5 py-3">Domínio</th>
                  <th className="px-5 py-3">Subdomínio</th>
                  <th className="px-5 py-3">Meta</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sites.length ? (
                  sites.map((site) => (
                    <tr key={site.id || site.fullDomain} className="border-t border-white/10">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white">
                          {site.nomeFantasia || site.razaoSocial}
                        </div>
                        <div className="text-xs text-slate-500">{site.cidade} {site.estado}</div>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-300">{site.cnpj}</td>
                      <td className="px-5 py-4 text-slate-300">{site.dominio}</td>
                      <td className="px-5 py-4 font-mono text-emerald-300">{site.fullDomain}</td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            site.metaTag
                              ? "rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200"
                              : "rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200"
                          }
                        >
                          {site.metaTag ? "Meta OK" : "Sem Meta"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            title="Editar"
                            type="button"
                            onClick={() => editSite(site)}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-slate-200 hover:bg-white/5"
                          >
                            <Pencil size={16} />
                            Editar
                          </button>
                          <a
                            title="Visualizar"
                            href={`/${site.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-200 hover:bg-white/5"
                          >
                            <Eye size={16} />
                          </a>
                          <button
                            title="Duplicar"
                            type="button"
                            onClick={() => duplicate(site)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-200 hover:bg-white/5"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            title="Excluir"
                            type="button"
                            onClick={() => remove(site)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-red-400/20 text-red-200 hover:bg-red-400/10"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-8 text-center text-slate-500" colSpan={6}>
                      Nenhum site publicado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
