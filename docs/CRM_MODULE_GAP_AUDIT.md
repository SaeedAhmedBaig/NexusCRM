# CRM Module Gap Audit

This audit captures the remaining gaps after the Effix-style CRM foundation, Fillout-inspired landing update, and Trello-style task UX phase.

## Implemented In This Phase

- Global light/dark tokens now include stricter CRM surface, control, grid, widget, and task status semantics.
- App shell, dashboard widgets, and task workspace now use a tighter Effix-style layout rhythm.
- Landing page copy and structure now follows a Fillout-inspired product story with capability pills, clearer CTA language, and expanded nav anchors.
- Tasks now have richer Trello-style board cards, summary cards, search/filter controls, quick add, detail tabs, checklist preview, comments metadata, and drag/drop status updates.
- Backend task workflow logging now records drag/drop status transitions correctly.

## Remaining Frontend Gaps

- Older email/settings/detail forms still contain local rounded input classes instead of the shared input/control primitives.
- Sales, service, automation, reports, integrations, memos, and settings screens are functional but need the same Effix widget-grid pass as dashboard/tasks.
- Email composer attachment UI is marked as coming soon and needs a real upload/attachment flow.
- The table primitive is improved globally, but individual custom tables in sales, projects, settings, and task list screens should be normalized to `DataTable` or a shared table shell.
- Mobile visual QA is still needed across dense CRM modules such as invoices, quotations, email accounts, and superadmin tenant detail.

## Remaining Backend Gaps

- Tasks support subtasks, comments, workflow logs, assignees, and search, but do not yet support custom columns, card ordering, covers, labels as persisted entities, attachments, or watchers.
- Email attachments need backend storage, virus/file validation, metadata persistence, and composer integration.
- Automation needs a fuller rule engine: triggers, conditions, scheduled jobs, audit logs, and retry state.
- Integrations need health checks, per-provider sync logs, OAuth refresh failure handling, and admin-visible incident states.
- Reporting and analytics need saved views, export jobs, cohort filters, and role-scoped dashboard layouts.

## Recommended 2026 Feature Phases

- Task power-up phase: custom board columns, card ordering, labels, watchers, attachments, templates, recurring tasks, and saved board filters.
- AI operations phase: account summaries, next-best actions, churn risk explanations, email draft assistance, and anomaly detection over pipeline activity.
- Workflow automation phase: no-code triggers/actions, SLA rules, approval chains, and automation observability.
- Revenue intelligence phase: forecast rollups, quote-to-cash analytics, renewal health scoring, and cohort retention dashboards.
- Enterprise admin phase: SCIM provisioning, SSO policy controls, audit exports, field-level permissions, and data residency controls.

## Verification Notes

- Static scans were run for placeholder/TODO-style text across frontend and backend modules.
- Full build and browser verification are tracked in the verification todo.
