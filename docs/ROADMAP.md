# Roadmap

Ordem sugerida — cada fase deixa o app funcional de ponta a ponta, nada fica pela metade.

## Fase 1 — Fundação (este momento)
- [x] Schema Postgres com RLS (`profiles`, `tasks`, `streaks`)
- [x] Auth email/senha via Supabase
- [x] Server Actions para CRUD de tarefas
- [x] Lógica de streak com testes unitários
- [x] CI (lint, typecheck, testes, build) no GitHub Actions
- [ ] Migrar a UI visual do protótipo (HTML) para componentes React do App Router
- [ ] Páginas `/entrar` e `/cadastro`

## Fase 2 — Deploy real
- [ ] Criar projeto no Supabase, rodar as migrations
- [ ] Subir repositório no GitHub
- [ ] Conectar na Vercel, configurar env vars
- [ ] Primeiro deploy funcional em produção com login real

## Fase 3 — Categorias e integração com o fluxo de revenda
- [ ] Categoria de tarefa livre (já suportada no schema: campo `category`)
- [ ] Filtro por categoria na UI (ex: "revenda-iphone", "social-media")
- [ ] Conectar o n8n para ler `tasks_pending_resale` e, por exemplo, gerar lembretes ou notificações automáticas

## Fase 4 — Refino de produto
- [ ] Notificação/lembrete antes do streak quebrar (ex: 20h se nada foi concluído no dia)
- [ ] Exportar tarefas concluídas por período (histórico de produtividade)
- [ ] Modo claro além do escuro atual

## Fase 5 — Se crescer para além de uso pessoal
- [ ] Rate limiting nas Server Actions
- [ ] 2FA via Supabase Auth
- [ ] Log de auditoria se outras pessoas ganharem acesso
