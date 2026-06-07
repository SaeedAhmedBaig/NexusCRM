const STEPS = [
  {
    step: '01',
    title: 'Provision your workspace',
    description: 'Create an isolated tenant with your subdomain, branding, and baseline configuration.',
  },
  {
    step: '02',
    title: 'Configure access and pipelines',
    description: 'Define roles, departments, deal stages, and approval workflows to match your org chart.',
  },
  {
    step: '03',
    title: 'Invite your team',
    description: 'Onboard users via email invite or connect your SSO provider for governed access.',
  },
];

export function OnboardingSteps() {
  return (
    <section className="marketing-section border-y border-border bg-muted/30">
      <div className="marketing-container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="marketing-eyebrow mb-4">Deployment</p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Operational in three steps
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            A structured rollout path designed for IT, RevOps, and business stakeholders.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((item, index) => (
            <div key={item.step} className="relative">
              {index < STEPS.length - 1 && (
                <div
                  className="absolute left-[calc(50%+2rem)] top-6 hidden h-px w-[calc(100%-4rem)] bg-border md:block"
                  aria-hidden
                />
              )}
              <div className="text-center md:text-left">
                <span className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-foreground">
                  {item.step}
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
