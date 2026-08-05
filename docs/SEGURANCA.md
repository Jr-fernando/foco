# Segurança — modelo de ameaças e decisões

Este documento existe para que qualquer decisão de segurança tomada no projeto tenha um porquê registrado, e para servir de checklist antes de cada deploy importante.

## Camadas de defesa (defesa em profundidade)

1. **Row Level Security (RLS) no Postgres** — a camada que realmente importa. Mesmo que a aplicação tenha um bug, o banco recusa devolver ou alterar linhas que não pertencem ao usuário autenticado. Todas as tabelas com dados de usuário (`profiles`, `tasks`, `streaks`) têm RLS habilitado desde a criação, nunca depois.
2. **Middleware de autenticação** — bloqueia rotas privadas antes mesmo de renderizar, redirecionando para `/entrar`. É conveniência de UX, não a defesa real.
3. **Validação em Server Actions** — todo `formData` recebido é validado (tamanho de título, prioridade dentro de um enum fechado) antes de tocar o banco.
4. **`auth.uid()` como única fonte de identidade** — nunca confiamos em um `user_id` vindo do client (formulário, query param). Toda política RLS e toda Server Action usa `auth.uid()` extraído do JWT validado pelo Supabase.

## Chaves e segredos

| Chave | Onde vive | Pode vazar? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Código do browser (pública por design) | Sim, sem problema — RLS é a proteção real |
| `SUPABASE_SERVICE_ROLE_KEY` | Nunca neste repo. Só como credencial dentro do n8n, se necessário | Não. Bypassa RLS inteiramente — se vazar, é acesso total ao banco |
| Senha do usuário | Nunca armazenada por nós — o Supabase Auth cuida do hash | — |

Regra prática: se uma variável de ambiente tem `NEXT_PUBLIC_` no nome, assuma que qualquer pessoa pode vê-la no DevTools do navegador. Nunca colocar a `service_role` key nesse prefixo.

## Streak não é editável pelo client

A tabela `streaks` não tem política de `INSERT`/`UPDATE` para o usuário comum — só `SELECT`. A única forma de incrementar é chamar a função `register_activity()`, que roda com `SECURITY DEFINER` (privilégios elevados) mas verifica internamente que `auth.uid() = p_user_id` antes de fazer qualquer alteração. Isso impede alguém de inflar a própria sequência manipulando requests diretamente na API REST do Supabase.

## Integração com n8n

O n8n acessa o Supabase com a `service_role` key (que ignora RLS), então ele consegue ler/escrever qualquer linha. Por isso:

- Essa chave só existe como credencial dentro do n8n (self-hosted, na sua máquina), nunca no código deste repositório nem em variáveis `NEXT_PUBLIC_`.
- Se o workflow do n8n só precisa ler tarefas de revenda pendentes, prefira consultar a view `tasks_pending_resale` (já filtrada) em vez da tabela `tasks` inteira — reduz o que fica exposto se a credencial do n8n vazar algum dia.

## Antes de cada deploy importante — checklist

- [ ] Toda tabela nova criada com `enable row level security` na mesma migration, nunca depois.
- [ ] Toda tabela nova tem pelo menos uma política de `SELECT` — sem isso, RLS habilitado sem política bloqueia tudo (inclusive você).
- [ ] Nenhuma chave `service_role` aparece em código commitado, log ou variável `NEXT_PUBLIC_*`.
- [ ] `npm run build` local passa antes de fazer push (o CI roda isso, mas builda com placeholders — teste com suas chaves reais localmente também).
- [ ] Testar RLS impersonando outro usuário no SQL Editor do Supabase antes de considerar uma tabela pronta (documentado nas fontes que orientaram este projeto).

## O que este projeto conscientemente não faz (ainda)

- **Rate limiting** nas Server Actions — para uso pessoal/pequena equipe o risco é baixo, mas se o app crescer para múltiplos usuários externos, isso entra no roadmap (ex: Vercel's built-in ou Upstash rate limit).
- **2FA** — Supabase Auth suporta, mas não é prioridade para a v1 de uso pessoal.
- **Auditoria/logs de alteração** — se em algum momento outra pessoa (cliente, funcionário) tiver acesso, vale adicionar uma tabela de log antes disso.
