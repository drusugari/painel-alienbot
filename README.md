# Alienbot Site Generator MVP

MVP focado em gerar sites institucionais por CNPJ, publicar por slug/subdominio e manter variações visuais fixas por site.

## Rodar localmente

```bash
pnpm install
pnpm dev
```

Abra `http://127.0.0.1:3000`.

Sem variáveis do Supabase, o projeto usa `.alienbot-sites.json` apenas para teste local. Em produção, configure Supabase.

## Publicar na Vercel

Sim, este projeto pode ser publicado na Vercel como app Next.js.

Antes do deploy de produção, configure Supabase. O fallback local em arquivo é só para desenvolvimento e não deve ser usado na Vercel.

1. Suba este projeto para um repositório GitHub.
2. Na Vercel, importe o repositório como projeto Next.js.
3. Adicione as variáveis de ambiente:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

4. Rode o deploy.
5. Para subdomínios, aponte o domínio principal para a Vercel e configure wildcard DNS, por exemplo `*.empresa.com.br`.

Também dá para publicar pela CLI depois do login:

```bash
pnpm dlx vercel
pnpm dlx vercel --prod
```

## Supabase

1. Crie a tabela usando `supabase/schema.sql`.
2. Copie `.env.example` para `.env.local`.
3. Preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

O painel continua sem autenticação, como pedido para o MVP.

## Como publicar

No painel:

1. Digite o CNPJ.
2. Clique em `GERAR DADOS`.
3. Revise os dados.
4. Informe `slug` e `dominio`.
5. Clique em `PUBLICAR`.

O site fica disponível por preview local em `/{slug}` e por host real em `{slug}.{dominio}` quando o domínio wildcard apontar para o deploy.
