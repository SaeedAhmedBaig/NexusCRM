import { ArrowUpRight, Check, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

const OUTCOMES = [
  'Launch a shared CRM workspace in minutes',
  'Route every customer stage to the right owner',
  'Keep sales, support, and renewals in one journey',
];

const STAGES = [
  ['Capture', 'bg-brand'],
  ['Qualify', 'bg-info'],
  ['Guide', 'bg-success'],
  ['Retain', 'bg-warning'],
];

export function CtaSection() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-background py-20 sm:py-24">
      <div className="marketing-container relative">
        <div className="relative overflow-hidden rounded-[2.75rem] border border-border bg-ink p-6 text-ink-foreground shadow-lg sm:p-8 lg:p-10">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/25 blur-3xl" />
          <div className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-info/20 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_0.86fr] lg:items-center">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-ink-foreground/10 bg-ink-foreground/10 px-3 py-1 text-xs font-semibold text-ink-foreground/70">
                Ready when your team is
              </p>
              <h2 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-ink-foreground sm:text-5xl lg:text-[3.35rem] lg:leading-[1.02]">
                Start with a cleaner way to run customer relationships
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-foreground/60">
                Bring contacts, conversations, tasks, and deals into a workspace your team can
                understand immediately. No messy setup, no scattered handoffs.
              </p>

              <div className="mt-7 space-y-3">
                {OUTCOMES.map((outcome) => (
                  <div key={outcome} className="flex items-center gap-3 text-sm font-medium text-ink-foreground/80">
                    <span className="flex size-6 items-center justify-center rounded-full bg-ink-foreground/10 text-success">
                      <Check className="size-3.5" />
                    </span>
                    {outcome}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button href="/signup?plan=free" size="lg" className="w-full sm:w-auto">
                  Start journey workspace
                  <ArrowUpRight className="size-4" />
                </Button>
                <Button href="/contact" variant="outline" size="lg" className="w-full border-ink-foreground/20 bg-ink-foreground/[0.08] text-ink-foreground hover:bg-ink-foreground/[0.12] sm:w-auto">
                  Request guided demo
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-ink-foreground/10 bg-ink-foreground/[0.07] p-5">
              <div className="rounded-[1.75rem] bg-card p-5 text-foreground shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-brand-light text-brand">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">From first touch to renewal</p>
                    <p className="text-xs text-muted-foreground">A clear path for every customer stage.</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {STAGES.map(([label, color], index) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className={`size-3 rounded-full ${color}`} />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${90 - index * 16}%` }} />
                      </div>
                      <span className="w-16 text-right text-xs font-semibold text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-3xl bg-ink p-4 text-ink-foreground">
                    <p className="text-2xl font-semibold">24h</p>
                    <p className="mt-1 text-xs opacity-70">faster handoffs</p>
                  </div>
                  <div className="rounded-3xl bg-success-light p-4 text-success">
                    <p className="text-2xl font-semibold">98%</p>
                    <p className="mt-1 text-xs opacity-75">task visibility</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
