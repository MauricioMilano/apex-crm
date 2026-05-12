## Why

The Apex CRM currently has only 3 email templates cobrindo cenários básicos (appointment confirmation, lead notification, client welcome). Dezenas de eventos do sistema — cancelamentos, reassignments, convites, mudanças de status, subscriptions — não disparam nenhuma comunicação por email. Isso deixa clientes sem aviso de cancelamentos, employees sem notificação de leads atribuídos, membros do time convidados sem receber credenciais, e assinantes sem confirmação de planos. Esta change expande o sistema de email para cobrir **todos os eventos do ciclo de vida do CRM** com templates editáveis.

## What Changes

- **6 novos templates** de prioridade alta: `appointment-cancelled`, `team-invite`, `lead-converted`, `subscription-activated`, `subscription-cancelled`, `lead-assigned`
- **6 novos templates** de prioridade média: `appointment-rescheduled`, `appointment-reminder`, `appointment-completed`, `client-welcome-admin`, `client-assigned`, `lead-status-changed`
- **5 novos templates** de prioridade baixa: `appointment-no-show`, `subscription-expired`, `subscription-expiring-soon`, `subscription-renewed`, `subscription-limit-warning`
- **3 novos templates** de auth/segurança: `password-reset`, `email-verification`, `welcome-admin`
- **Total: 20 novos templates** (além dos 3 existentes) = 23 templates no total
- **Triggers**: Modificar 6 Server Actions existentes para disparar emails nos eventos apropriados
- **Scheduler**: Novo sistema de agendamento (cron/background) para templates temporais (reminder, expiring-soon)
- **Extensão do `sendEmail()`**: Suporte a envio para múltiplos destinatários (employee assignee + org from)
- **UI de Templates**: Agrupamento por categorias expandidas (appointment, lead, client, subscription, team, auth)
- **Novas categorias** no modelo `EmailTemplate`: `subscription`, `team`, `auth`

## Capabilities

### New Capabilities

- `email-templates-appointment`: Templates para todo o ciclo de vida do appointment — confirmed (existente), cancelled, rescheduled, reminder, completed, no-show. Cada um com variáveis específicas e triggers nas actions de appointment.
- `email-templates-lead`: Templates para o funil de leads — notification (existente), assigned (employee notificado ao receber lead), converted (lead viram cliente), status-changed (mudança de etapa no funil).
- `email-templates-client`: Templates para gestão de clientes — welcome (existente), welcome-admin (criação manual por admin), assigned (employee notificado ao receber cliente).
- `email-templates-subscription`: Templates para subscription plans — activated (plano contratado), cancelled (plano cancelado), expired (prazo encerrado), expiring-soon (aviso prévio), renewed (ciclo renovado), limit-warning (perto do limite de appointments).
- `email-templates-team`: Templates para equipe — invite (convite com senha temporária), welcome-admin (primeiro acesso do admin após registro da organização).
- `email-templates-auth`: Templates de segurança — password-reset (link de redefinição), email-verification (confirmação de email), magic-link (acesso sem senha).
- `email-scheduler`: Sistema de agendamento para envio programado de emails (lembrete de appointment, aviso de expiração de subscription). Baseado em fila no banco ou cron job simples.
- `email-multi-recipient`: Suporte a envio de email para múltiplos destinatários em uma única chamada (ex: notificar employee + org ao mesmo tempo).

### Modified Capabilities

- `email-templates` (do change add-email-system): O sistema de templates existente é estendido para:
  - Suportar as novas categorias `subscription`, `team`, `auth` no agrupamento da UI
  - `templateRequiredVars` validar automaticamente as variáveis de todos os templates
  - O editor de templates mostrar as novas categorias no filtro/grupo
  - A página de listagem de templates (`template-list.tsx`) exibir todos os 23 templates

## Impact

| Area | Impact |
|------|--------|
| **Database** | Nenhuma migration nova — `EmailTemplate.category` já é String. Novas categorias são apenas valores. |
| **Backend** | `src/lib/email/templates.ts` — +20 definições de template. `src/lib/email/send.ts` — estendido para multi-recipient. `src/actions/appointments.ts` — triggers para cancelled, rescheduled, completed, no-show. `src/actions/leads.ts` — triggers para assigned, converted, status-changed. `src/actions/clients.ts` — triggers para created (manual), assigned. `src/actions/client-subscriptions.ts` — triggers para activated, cancelled. `src/actions/settings.ts` — trigger para team-invite. `src/actions/auth.ts` — triggers para welcome-admin, password-reset. |
| **Frontend** | `src/components/email/template-list.tsx` — expandir categorias. `src/app/(dashboard)/settings/email/page.tsx` — mostrar novos templates. |
| **New Module** | `src/lib/email/scheduler.ts` — sistema de agendamento (cron-based). |
| **Dependencies** | `node-cron` ou `bull` se optar por fila Redis. Alternativa: scheduler simples via Prisma + interval. |
| **Environment** | Nenhuma nova env var necessária. |

