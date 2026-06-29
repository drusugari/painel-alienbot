create extension if not exists "pgcrypto";

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  cnpj text not null,
  razao_social text not null,
  nome_fantasia text,
  descricao text,
  telefone text,
  whatsapp text,
  email text,
  instagram text,
  facebook text,
  cidade text,
  estado text,
  cep text,
  atividade_principal text,
  slug text not null,
  dominio text not null,
  full_domain text not null,
  meta_tag text,
  theme_id integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, dominio),
  unique (full_domain)
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sites_set_updated_at on public.sites;

create trigger sites_set_updated_at
before update on public.sites
for each row execute function public.set_updated_at();

-- MVP sem autenticação complexa:
-- Use a SUPABASE_SERVICE_ROLE_KEY no servidor ou mantenha RLS desligado nessa tabela.
