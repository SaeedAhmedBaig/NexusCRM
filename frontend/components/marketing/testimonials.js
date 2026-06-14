const TESTIMONIALS = [
  {
    quote:
      'RBAC and department scoping work exactly how our security team expects — without the overhead of a legacy CRM migration.',
    name: 'James Okonkwo',
    role: 'IT Director',
    company: 'Meridian Group',
  },
  {
    quote:
      'Per-tenant isolation was the deciding factor in procurement. We could demonstrate data boundaries to auditors on day one.',
    name: 'Elena Ruiz',
    role: 'Head of Revenue Operations',
    company: 'Northline Industries',
  },
  {
    quote:
      'Audit trails for every permission change gave our compliance team the visibility they needed without a separate logging tool.',
    name: 'Sarah Chen',
    role: 'VP Sales',
    company: 'Apex Systems',
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="marketing-section border-t border-border bg-surface">
      <div className="marketing-container">
        <div className="marketing-section-header">
          <p className="marketing-eyebrow mb-4">Customer perspective</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
            Built for teams that care about control and clarity
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Representative feedback themes from revenue and IT leaders during platform selection.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <blockquote
              key={item.name}
              className="marketing-card p-6"
            >
              <p className="text-sm leading-relaxed text-foreground">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-5 border-t border-border pt-5">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.role}, {item.company}
                </p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
