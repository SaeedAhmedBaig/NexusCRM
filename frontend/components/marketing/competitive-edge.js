import { Layers, Shield, Zap, BarChart3, Building2, Bell } from 'lucide-react';

/** Positioning based on recurring G2/Capterra complaints about legacy CRMs */
const PILLARS = [
  {
    icon: Layers,
    title: 'Unified revenue stack',
    problem: 'Pipedrive & point tools force add-on sprawl for marketing, service, and reporting.',
    solution: 'CRM, pipeline, email campaigns, tickets, and analytics in one tenant — no Zapier tax.',
  },
  {
    icon: BarChart3,
    title: 'Reporting without exports',
    problem: 'Teams export to BI tools because native CRM reports cannot cross objects or track MRR.',
    solution: 'Executive dashboards, funnel analytics, and team performance from your live data.',
  },
  {
    icon: Zap,
    title: 'Automation without consultants',
    problem: 'Salesforce & Dynamics need admins, partners, and months before workflows go live.',
    solution: 'Rules, mass mail, and embed forms you can configure in minutes — not quarters.',
  },
  {
    icon: Shield,
    title: 'Enterprise tenancy built-in',
    problem: 'Mid-market teams outgrow single-workspace CRMs but cannot afford Salesforce TCO.',
    solution: 'Subdomain isolation, RBAC, departments, audit trail, and Stripe billing per workspace.',
  },
  {
    icon: Building2,
    title: 'Multi-tenant by design',
    problem: 'Agencies and SaaS operators juggle separate accounts or brittle custom setups.',
    solution: 'One platform account, many client workspaces — superadmin oversight included.',
  },
  {
    icon: Bell,
    title: 'Clear system feedback',
    problem: 'Silent failures and buried errors are a top complaint across CRM reviews.',
    solution: 'Centralized in-app notifications for every success, warning, and API error.',
  },
];

export function CompetitiveEdge() {
  return (
    <section className="border-t border-border bg-surface px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-meta font-semibold uppercase tracking-wider text-brand">Why NexusCRM</p>
          <h2 className="mt-3 text-display text-foreground sm:text-4xl">
            Enterprise depth without enterprise drag
          </h2>
          <p className="mt-4 text-body-lg text-muted">
            We studied what revenue teams praise — and where HubSpot, Salesforce, and Pipedrive
            consistently fall short in reviews. NexusCRM is built to close those gaps.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">
                  <span className="font-medium text-foreground/80">The gap: </span>
                  {item.problem}
                </p>
                <p className="mt-2 text-sm text-muted">
                  <span className="font-medium text-brand">Our answer: </span>
                  {item.solution}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
