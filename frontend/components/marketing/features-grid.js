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
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="marketing-eyebrow mb-4">Journey intelligence</p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            One dashboard for the entire customer path
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Replace static pipeline views with a living journey system that helps sales, marketing,
            and success work from the same customer truth.
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
