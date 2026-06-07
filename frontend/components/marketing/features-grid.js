import {
  Shield,
  Users,
  Lock,
  ClipboardList,
  BarChart3,
  Bell,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Shield,
    title: 'Per-tenant data isolation',
    description:
      'Every workspace runs in a dedicated tenant boundary. Customer data never commingles across organizations.',
  },
  {
    icon: Users,
    title: 'Role-based access control',
    description:
      'Granular permissions by role, department, and object type. Enforce least-privilege across your revenue org.',
  },
  {
    icon: Lock,
    title: 'SSO-ready authentication',
    description:
      'Integrate with your identity provider. SAML and OIDC support for enterprise single sign-on workflows.',
  },
  {
    icon: ClipboardList,
    title: 'Audit trails',
    description:
      'Immutable activity logs for every configuration change, data export, and permission update.',
  },
  {
    icon: BarChart3,
    title: 'Unified pipeline analytics',
    description:
      'Pipeline, campaigns, and service metrics in one dashboard — sourced from live tenant data, not stale exports.',
  },
  {
    icon: Bell,
    title: 'Centralized notifications',
    description:
      'Deal movements, SLA breaches, and workflow events delivered through a single notification layer.',
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="marketing-section bg-background">
      <div className="marketing-container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="marketing-eyebrow mb-4">Platform capabilities</p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Built for security and scale
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Enterprise governance controls alongside the sales, marketing, and service tools your
            teams use every day.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-muted">
                  <Icon className="size-5 text-foreground" strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
