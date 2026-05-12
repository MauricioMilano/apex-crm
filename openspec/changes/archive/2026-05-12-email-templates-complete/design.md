## Context

O Apex CRM já possui infraestrutura de email implementada no change `add-email-system`:
- SMTP configurável via UI (Nodemailer + AES-256)
- 3 templates built-in: `appointment-confirmed`, `lead-notification`, `client-welcome`
- Engine de renderização `{{var}}` com HTML escaping
- Trigger points em `createAppointment`, `submitFormEntry`, `registerClient`

Esta mudança expande para **20 novos templates** cobrindo todo o ciclo de vida do CRM, adiciona scheduler para envios temporais, e estende o sistema de destinatários.

### Arquitetura atual (simplificada)

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Server Action │────▶│  sendEmail()     │────▶│  Nodemailer      │
│ (trigger)     │     │  (src/lib/email) │     │  (SMTP)          │
└──────────────┘     │  ┌────────────┐   │     └──────────────────┘
                     │  │ renderer   │   │
                     │  │ templates  │   │
                     │  │ encrypt    │   │
                     │  │ transporter│   │
                     │  └────────────┘   │
                     └──────────────────┘
```

## Goals / Non-Goals

**Goals:**
- Criar 20 novos templates de email com built-in defaults e variáveis documentadas
- Adicionar triggers em todas as Server Actions relevantes (appointments, leads, clients, subscriptions, team, auth)
- Suporte a multi-recipient (enviar para cliente + employee + org simultaneamente)
- Sistema de scheduler para emails temporais (reminder, expiring-soon)
- Todos os templates editáveis via UI de settings (reutilizando template-editor existente)
- Extender categorias na UI para incluir subscription, team, auth

**Non-Goals:**
- Payment gateway / billing emails (fora do escopo atual)
- Template engine mais complexa que `{{var}}` (Handlebars, JSX — risco de segurança)
- Filas de retry ou tracking de entrega (open/click rates)
- Sistema de unsubscribe / preferências de email
- Personalização de remetente por template (todos usam o SMTP configurado)
- Templates para webhook ou integrações externas
- Suporte a múltiplos idiomas

## Decisions

### 1. Categorias de templates — String field, sem migration

| Alternativa | Veredito |
|---|---|
| Enum no Prisma | Rejeitado — requer migration, `category` já é String |
| **String field existente** | **Escolhido** — `category` já é String, novos valores são apenas dados |

As novas categorias `subscription`, `team`, `auth` serão usadas na UI para agrupamento.

### 2. Scheduler — Prisma-based polling (sem Redis)

| Alternativa | Veredito |
|---|---|
| Bull + Redis | Rejeitado — dependência externa, overkill para o volume atual |
| node-cron no mesmo processo | Rejeitado — em serverless (Vercel) não há garantia de cron persistente |
| **Prisma-based polling + endpoint HTTP** | **Escolhido** — tabela `EmailSchedule` no PG, verificada por um endpoint `GET /api/cron/email` chamado por cron externo (cron-job.org, Vercel Cron, etc) |

Uma tabela `EmailSchedule` armazena emails a serem enviados no futuro. Um endpoint cron consulta schedules pendentes e envia. Isso funciona em qualquer plataforma sem dependências externas.

```prisma
model EmailSchedule {
  id           String   @id @default(cuid())
  organizationId String
  templateName String
  to           String
  variables    Json     @default("{}")
  scheduledFor DateTime
  sentAt       DateTime?
  createdAt    DateTime @default(now())

  @@map("email_schedules")
}
```

### 3. Multi-recipient — campo `cc` opcional no `sendEmail()`

O `sendEmail()` atual aceita `{ to, templateName, variables }`. Será estendido para aceitar `{ to: string | string[], cc?: string[] }`. Quando `to` é um array, envia para todos os destinatários (To: lista). O template é renderizado uma vez e reusado.

```typescript
export interface SendEmailOptions {
  templateName: string
  to: string | string[]        // ← estendido
  cc?: string[]                // ← novo
  variables: Record<string, string>
}
```

### 4. Templates temporais — prefixo `scheduled-` nos nomes

Templates que exigem agendamento (reminder, expiring-soon) são identificados pelo prefixo `scheduled-` no nome. O scheduler consulta a tabela `EmailSchedule` e também usa queries diretas ao banco (ex: appointments com startTime nas próximas 24h).

```
appointment-reminder       → prefixo scheduled → cria EmailSchedule
subscription-expiring-soon → prefixo scheduled → cria EmailSchedule
```

### 5. Triggers — chamadas síncronas + fire-and-forget

Mesmo padrão do sistema existente: o trigger chama `sendEmail()` com `void` (fire-and-forget). Falhas de email nunca bloqueiam a action principal. Para templates agendados, o trigger cria um `EmailSchedule` record em vez de enviar imediatamente.

```typescript
// Trigger imediato (mesmo padrão existente)
void sendEmail({ templateName: "appointment-cancelled", to: client.email, variables })

// Trigger agendado
void scheduleEmail({
  templateName: "appointment-reminder",
  to: client.email,
  variables,
  scheduledFor: appointment.startTime - 24h,
})
```

### 6. Templates sem destinatário claro — regras de fallback

| Template | Destinatário | Fallback |
|---|---|---|
| `appointment-cancelled` | Cliente (se tem email) | Employee + org `smtpFrom` |
| `appointment-rescheduled` | Cliente | Employee |
| `lead-assigned` | Employee (`assignedTo`) | Org `smtpFrom` |
| `lead-converted` | Cliente (email do lead) | — |
| `client-assigned` | Employee (`assignedTo`) | Org `smtpFrom` |
| `client-welcome-admin` | Cliente (email) | — |
| `team-invite` | Email do convidado | — |

### 7. UI de templates — reuso total do template-editor existente

O `template-editor.tsx`, `template-preview.tsx`, e `template-list.tsx` existentes são reutilizados. A única mudança na UI é:
- `template-list.tsx`: expandir os grupos de categoria para incluir `subscription`, `team`, `auth`
- Adicionar ícones/cores por categoria
- A página de listagem mostra todos os 23 templates

## Template Catalog (Complete)

### Appointment — Templates

| # | Template | Prioridade | Disparo | Destinatário | Variáveis |
|---|---|---|---|---|---|
| 1 | `appointment-confirmed` | ✅ existente | `createAppointment()` | Cliente | `{{clientName}}`, `{{date}}`, `{{time}}`, `{{serviceName}}`, `{{employeeName}}`, `{{locationName}}`, `{{orgName}}` |
| 2 | `appointment-cancelled` | 🔴 alta | `updateAppointmentStatus("cancelled")` | Cliente + employee | `{{clientName}}`, `{{serviceName}}`, `{{date}}`, `{{time}}`, `{{reason}}`, `{{orgName}}` |
| 3 | `appointment-rescheduled` | 🟡 média | `updateAppointment()` com mudança de startTime | Cliente | `{{clientName}}`, `{{serviceName}}`, `{{oldDate}}`, `{{oldTime}}`, `{{newDate}}`, `{{newTime}}`, `{{employeeName}}`, `{{orgName}}` |
| 4 | `appointment-reminder` | 🟡 média | Scheduler (N horas antes) | Cliente | `{{clientName}}`, `{{serviceName}}`, `{{date}}`, `{{time}}`, `{{employeeName}}`, `{{locationName}}`, `{{orgName}}` |
| 5 | `appointment-completed` | 🟡 média | `updateAppointmentStatus("completed")` | Cliente | `{{clientName}}`, `{{serviceName}}`, `{{date}}`, `{{employeeName}}`, `{{orgName}}`, `{{feedbackUrl}}` |
| 6 | `appointment-no-show` | 🟢 baixa | `updateAppointmentStatus("no_show")` | Cliente | `{{clientName}}`, `{{serviceName}}`, `{{date}}`, `{{time}}`, `{{orgName}}` |

### Lead — Templates

| # | Template | Prioridade | Disparo | Destinatário | Variáveis |
|---|---|---|---|---|---|
| 7 | `lead-notification` | ✅ existente | `submitFormEntry()` | Org `smtpFrom` | `{{firstName}}`, `{{lastName}}`, `{{email}}`, `{{phone}}`, `{{company}}`, `{{service}}`, `{{orgName}}` |
| 8 | `lead-assigned` | 🔴 alta | `createLead()` / `updateLead()` com `assignedTo` definido | Employee assignee | `{{employeeName}}`, `{{leadName}}`, `{{email}}`, `{{phone}}`, `{{company}}`, `{{source}}`, `{{orgName}}` |
| 9 | `lead-converted` | 🔴 alta | `convertLeadToClient()` | Novo cliente | `{{clientName}}`, `{{email}}`, `{{orgName}}`, `{{loginUrl}}` |
| 10 | `lead-status-changed` | 🟡 média | `updateLead()` com mudança de `statusId` | Employee assignee | `{{leadName}}`, `{{oldStatus}}`, `{{newStatus}}`, `{{orgName}}` |

### Client — Templates

| # | Template | Prioridade | Disparo | Destinatário | Variáveis |
|---|---|---|---|---|---|
| 11 | `client-welcome` | ✅ existente | `registerClient()` | Cliente | `{{clientName}}`, `{{email}}`, `{{orgName}}`, `{{loginUrl}}` |
| 12 | `client-welcome-admin` | 🟡 média | `createClient()` manual (admin) | Cliente | `{{clientName}}`, `{{email}}`, `{{orgName}}`, `{{loginUrl}}`, `{{adminName}}` |
| 13 | `client-assigned` | 🟡 média | `createClient()` / `updateClient()` com `assignedTo` | Employee assignee | `{{employeeName}}`, `{{clientName}}`, `{{email}}`, `{{phone}}`, `{{orgName}}` |

### Subscription — Templates

| # | Template | Prioridade | Disparo | Destinatário | Variáveis |
|---|---|---|---|---|---|
| 14 | `subscription-activated` | 🔴 alta | `assignPlan()` | Cliente | `{{clientName}}`, `{{planName}}`, `{{price}}`, `{{billingPeriod}}`, `{{startDate}}`, `{{orgName}}` |
| 15 | `subscription-cancelled` | 🔴 alta | `cancelSubscription()` | Cliente | `{{clientName}}`, `{{planName}}`, `{{endDate}}`, `{{orgName}}` |
| 16 | `subscription-expired` | 🟢 baixa | Scheduler (quando `status` muda para `expired`) | Cliente | `{{clientName}}`, `{{planName}}`, `{{orgName}}` |
| 17 | `subscription-expiring-soon` | 🟢 baixa | Scheduler (7 dias antes do `currentPeriodEnd`) | Cliente | `{{clientName}}`, `{{planName}}`, `{{expiryDate}}`, `{{orgName}}` |
| 18 | `subscription-renewed` | 🟢 baixa | Scheduler (quando `renewPeriodIfNeeded()` avança ciclo) | Cliente | `{{clientName}}`, `{{planName}}`, `{{newPeriodStart}}`, `{{newPeriodEnd}}`, `{{orgName}}` |
| 19 | `subscription-limit-warning` | 🟢 baixa | `createAppointment()` quando `appointmentsUsed >= 80%` do limite | Cliente | `{{clientName}}`, `{{planName}}`, `{{used}}`, `{{max}}`, `{{remaining}}`, `{{orgName}}` |

### Team — Templates

| # | Template | Prioridade | Disparo | Destinatário | Variáveis |
|---|---|---|---|---|---|
| 20 | `team-invite` | 🔴 alta | `inviteTeamMember()` | Membro convidado | `{{invitedName}}`, `{{email}}`, `{{tempPassword}}`, `{{orgName}}`, `{{invitedBy}}`, `{{loginUrl}}` |
| 21 | `welcome-admin` | 🟢 baixa | `registerUser()` (primeiro admin) | Admin recém-registrado | `{{adminName}}`, `{{email}}`, `{{orgName}}`, `{{loginUrl}}`, `{{setupUrl}}` |

### Auth — Templates

| # | Template | Prioridade | Disparo | Destinatário | Variáveis |
|---|---|---|---|---|---|
| 22 | `password-reset` | 🟡 média | Nova action `requestPasswordReset()` | Usuário | `{{userName}}`, `{{resetUrl}}`, `{{orgName}}` |
| 23 | `email-verification` | 🟢 baixa | `registerClient()` / `registerUser()` (quando verificação habilitada) | Novo usuário | `{{userName}}`, `{{verifyUrl}}`, `{{orgName}}` |

### Resumo: 20 novos + 3 existentes = 23 templates

```
Categoria      Existentes   Novos    Total
─────────────────────────────────────────
appointment       1          5         6
lead              1          3         4
client            1          2         3
subscription      0          6         6
team              0          2         2
auth              0          2         2
─────────────────────────────────────────
TOTAL             3         20        23
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   TRIGGER ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐   ┌────────────────┐   ┌──────────────────┐   │
│  │ Server   │──▶│ sendEmail()    │──▶│ Nodemailer       │   │
│  │ Actions  │   │ (imediato)     │   │ (SMTP)           │   │
│  │          │   └────────────────┘   └──────────────────┘   │
│  │ • appts  │                                              │
│  │ • leads  │   ┌────────────────┐                          │
│  │ • clients│──▶│ scheduleEmail()│────┐                     │
│  │ • subs   │   │ (temporal)     │    │                     │
│  │ • team   │   └────────────────┘    │                     │
│  │ • auth   │                         ▼                     │
│  └──────────┘               ┌──────────────────┐            │
│                             │ EmailSchedule    │            │
│                             │ (tabela PG)      │            │
│                             └───────┬──────────┘            │
│                                     │                        │
│                        ┌────────────┴────────────┐          │
│                        │  GET /api/cron/email     │          │
│                        │  (chamado externamente)  │          │
│                        └────────────┬────────────┘          │
│                                     │                        │
│                                     ▼                        │
│                              ┌──────────────────┐            │
│                              │ sendEmail()      │            │
│                              └──────────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de disparo imediato (20 templates)

```
Server Action completa mutação no DB
       │
       ▼
Verifica se há destinatário válido (cliente.email, employee.email, etc)
       │
       ▼
void sendEmail({ templateName, to, variables })
       │
       ├── SMTP enabled?  NÃO → retorna silenciosamente
       ├── Template existe? NÃO → fallback para built-in
       ├── Renderiza {{var}} com HTML escaping
       └── Envia via Nodemailer (timeout 10s)
           │
           └── Falha? → loga erro, não bloqueia action
```

### Fluxo de disparo agendado (3 templates)

```
Server Action / Scheduler identifica necessidade
       │
       ▼
void scheduleEmail({ templateName, to, variables, scheduledFor })
       │
       ▼
Cria registro em EmailSchedule
       │
       ▼
... (tempo passa) ...
       │
       ▼
GET /api/cron/email é chamado (a cada 5 min)
       │
       ▼
Busca EmailSchedule WHERE sentAt IS NULL AND scheduledFor <= now()
       │
       ▼
Para cada: sendEmail() → marca sentAt
```

### Pontos de trigger detalhados

| Arquivo | Action | Template(s) | Condição |
|---|---|---|---|
| `appointments.ts` | `createAppointment()` | `appointment-confirmed` (existente) | `client?.email` |
| `appointments.ts` | `createAppointment()` | `subscription-limit-warning` | subscription usage >= 80% |
| `appointments.ts` | `updateAppointmentStatus("cancelled")` | `appointment-cancelled` | `client?.email` ou `lead?.email` |
| `appointments.ts` | `updateAppointmentStatus("completed")` | `appointment-completed` | `client?.email` |
| `appointments.ts` | `updateAppointmentStatus("no_show")` | `appointment-no-show` | `client?.email` |
| `appointments.ts` | `updateAppointment()` (reschedule) | `appointment-rescheduled` | `client?.email` + se startTime mudou |
| `appointments.ts` | `createAppointment()` | `appointment-reminder` (scheduled) | `client?.email` → agenda para 24h antes |
| `leads.ts` | `createLead()` | `lead-notification` (se manual) + `lead-assigned` (se `assignedTo`) | org email + assignee email |
| `leads.ts` | `updateLead()` com `assignedTo` mudou | `lead-assigned` | novo assignee email |
| `leads.ts` | `updateLead()` com `statusId` mudou | `lead-status-changed` | assignee email |
| `leads.ts` | `convertLeadToClient()` | `lead-converted` | lead email |
| `clients.ts` | `createClient()` | `client-welcome-admin` + `client-assigned` (se `assignedTo`) | client email + assignee email |
| `clients.ts` | `updateClient()` com `assignedTo` mudou | `client-assigned` | novo assignee email |
| `client-subscriptions.ts` | `assignPlan()` | `subscription-activated` | client email |
| `client-subscriptions.ts` | `cancelSubscription()` | `subscription-cancelled` | client email |
| `client-subscriptions.ts` | `renewPeriodIfNeeded()` | `subscription-renewed` | client email |
| `settings.ts` | `inviteTeamMember()` | `team-invite` | invited email |
| `auth.ts` | `registerUser()` | `welcome-admin` | admin email |
| `client-registration.ts` | `registerClient()` | `client-welcome` (existente) + `email-verification` (se habilitado) | client email |
| `auth.ts` | `requestPasswordReset()` (nova) | `password-reset` | user email |
| Scheduler | Cron job | `appointment-reminder` | 24h antes |
| Scheduler | Cron job | `subscription-expiring-soon` | 7 dias antes |
| Scheduler | Cron job | `subscription-expired` | ao expirar |
| Scheduler | Cron job | `subscription-renewed` | ao renovar |

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| **Volume de templates**: 23 templates é muita coisa para manter | Todos têm built-in defaults; admin só edita se quiser. Testes automatizados garantem que todas as variáveis existem. |
| **Scheduler sem fila**: Perda de emails se o cron falhar | O cron job marca `sentAt` após envio. Se falhar, tenta de novo na próxima execução. Idempotente. |
| **Multi-recipient exposto a spam**: Enviar para CC sem consentimento | Apenas emails institucionais (org, employee). Cliente nunca recebe CC de outro cliente. |
| **Trigger de reschedule complexo**: Detectar mudança de data vs outros campos | Comparar `startTime` do input com o valor anterior no banco antes do update. |
| **Subscription-limit-warning**: Calcular 80% precisa de precisão | Usar `Math.ceil(limit * 0.8)`. Verificar no trigger de `createAppointment` após incremento. |
| **Password reset sem email configurado**: Usuário não consegue redefinir senha | `requestPasswordReset()` retorna erro se SMTP não estiver habilitado. Alternativa: mostrar token no console em dev. |
| **Destrutivo de dados**: Nenhum — templates são dados, não schema | ⚠️ Nenhum schema change destrutivo. |

## Open Questions

1. **Scheduler**: Usar cron-job.org externo ou Vercel Cron (pro) para o endpoint? A implementação é a mesma — endpoint HTTP + tabela PG. A diferença é onde o cron roda.
2. **`appointment-reminder`**: Quantas horas antes? 24h é padrão, mas poderia ser configurável por organização via `OrganizationSetting`.
3. **`password-reset`**: O token de reset deve expirar em quanto tempo? Sugestão: 1 hora.
4. **`email-verification`**: Deve ser opcional (toggle em settings) ou sempre ativo? Sugestão: opcional para não quebrar fluxo de registro atual.

