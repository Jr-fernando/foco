# Foco

Gerenciador de tarefas com foco em ritmo e constância — sequência de dias ativos, prioridades e mensagens de motivação, sem gamificação punitiva.

## Stack

| Camada         | Tecnologia                          | Por quê |
|----------------|--------------------------------------|---------|
| Frontend       | Next.js 14 (App Router) + TypeScript | Server Components reduzem JS enviado ao browser; Server Actions eliminam a necessidade de uma API REST separada |
| Auth + Banco   | Supabase (Postgres + Auth)           | Autenticação pronta, Postgres real, Row Level Security aplicado no banco (não só na aplicação) |
| Deploy         | Vercel                               | Deploy automático a cada push, integração nativa com Supabase |
| Automação      | n8n (externo a este repo)            | Lê/escreve tarefas via API do Supabase usando a `service_role` key, nunca a `anon` key do frontend |

## Por que esse stack e não outro

- **Sem backend separado**: Server Actions do Next.js substituem a necessidade de um Express/Fastify à parte. Menos peças móveis, menos superfície de ataque.
- **RLS em vez de checagem só na aplicação**: mesmo que uma rota tenha um bug amanhã, o banco recusa devolver dados de outro usuário. Ver [`docs/SEGURANCA.md`](docs/SEGURANCA.md).
- **Airtable ficou fora deste projeto**: Airtable é ótimo para guidelines de marca (uso não-transacional), mas ruim para dados que mudam o tempo todo com concorrência (tarefas sendo marcadas). Postgres via Supabase resolve isso nativamente. O n8n pode continuar orquestrando os dois mundos.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Banco de dados

O schema vive em `supabase/migrations/`. Para aplicar num projeto Supabase novo:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

Isso cria as tabelas `profiles`, `tasks`, `streaks`, todas as políticas de RLS, e a função `register_activity()` que calcula a sequência de dias.

## Scripts

| Comando            | O que faz |
|---------------------|-----------|
| `npm run dev`        | Ambiente de desenvolvimento |
| `npm run build`      | Build de produção (o mesmo que a Vercel roda) |
| `npm run lint`       | ESLint |
| `npm run typecheck`  | Checagem de tipos sem gerar arquivos |
| `npm run test`       | Testes unitários (Vitest) |

## Deploy

1. Suba este repositório no GitHub.
2. Na Vercel: `New Project` → importe o repositório.
3. A integração oficial Supabase↔Vercel injeta as env vars automaticamente (ou configure manualmente usando `.env.example` como guia).
4. Cada push em `main` que passar no CI (`.github/workflows/ci.yml`) gera um deploy novo.

## Estrutura

```
app/
  actions/tasks.ts      # Server Actions: criar, concluir, excluir tarefa
  (auth)/                # rotas de entrar/cadastro
  page.tsx               # painel principal
lib/
  supabase/client.ts      # cliente para Client Components
  supabase/server.ts      # cliente para Server Components/Actions
  streak.ts               # lógica de sequência (espelha a função SQL, testável em CI)
supabase/
  migrations/0001_init.sql  # schema + RLS + função de streak
docs/
  SEGURANCA.md             # modelo de ameaças e decisões de segurança
  ROADMAP.md               # próximos passos priorizados
```

## Roadmap

Ver [`docs/ROADMAP.md`](docs/ROADMAP.md).
