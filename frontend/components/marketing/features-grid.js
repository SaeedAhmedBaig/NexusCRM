import {
  Route,
  Users,
  Radar,
  MessageSquareMore,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Route,
    title: 'Journey stage tracking',
    description:
      'Map every account from awareness to renewal with live movement, stage velocity, and owner accountability.',
  },
  {
    icon: Users,
    title: 'Behavior-based segments',
    description:
      'Group high-intent leads, expansion candidates, and at-risk customers automatically from activity signals.',
  },
  {
    icon: Radar,
    title: 'Risk and intent radar',
    description:
      'See who is ready to buy, who is going quiet, and where your team should act before the funnel changes.',
  },
  {
    icon: MessageSquareMore,
    title: 'Conversation context',
    description:
      'Unify emails, notes, tickets, campaign touches, and task history into one account timeline.',
  },
  {
    icon: Sparkles,
    title: 'Next-best action cues',
    description:
      'Turn journey gaps into suggested follow-ups, onboarding tasks, retention plays, and expansion motions.',
  },
  {
    icon: ShieldCheck,
    title: 'Governed workspace data',
    description:
      'Keep every customer journey inside isolated tenant workspaces with RBAC, audit trails, and admin oversight.',
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="marketing-section bg-background">
      <div className="marketing-container">
        <div className="marketing-section-header">
          <p className="marketing-eyebrow mb-4">It all starts with one workspace</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
            Build the exact customer system your team needs
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Create workspaces, automate handoffs, review results, and collaborate without spreading
            customer data across disconnected tools.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="marketing-card p-6 transition-transform hover:-translate-y-1"
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-brand-light text-brand">
                  <Icon className="size-5" strokeWidth={1.85} />
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
