const STATS = [
  { value: '5x', label: 'Journey visibility', description: 'From first visit through renewal and expansion' },
  { value: '82%', label: 'Health scoring', description: 'Composite score from activity, pipeline, and service data' },
  { value: '+18%', label: 'Conversion lift', description: 'Identify intent signals before deals change stage' },
  { value: '1 view', label: 'Customer context', description: 'Sales, marketing, and success actions in one timeline' },
];

export function StatsSection() {
  return (
    <section id="analytics" className="marketing-section bg-background">
      <div className="marketing-container">
        <div className="marketing-section-header">
          <p className="marketing-eyebrow mb-4">Journey outcomes</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
            Turn customer movement into measurable action
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="marketing-card p-6"
            >
              <p className="text-4xl font-semibold tracking-[-0.05em] text-foreground">{stat.value}</p>
              <p className="mt-2 text-sm font-medium text-foreground">{stat.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
