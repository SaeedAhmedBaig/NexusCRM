const STATS = [
  { value: '99.9%', label: 'Platform uptime SLA', description: 'Measured across production tenants' },
  { value: '100%', label: 'Tenant data isolation', description: 'No shared data between workspaces' },
  { value: '<14 days', label: 'Typical rollout', description: 'From provisioning to team onboarding' },
  { value: 'Full', label: 'Audit log coverage', description: 'Every config and permission change recorded' },
];

export function StatsSection() {
  return (
    <section id="analytics" className="marketing-section bg-background">
      <div className="marketing-container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="marketing-eyebrow mb-4">Reliability</p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Infrastructure you can defend in procurement
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-card p-6"
            >
              <p className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-2 text-sm font-medium text-foreground">{stat.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
