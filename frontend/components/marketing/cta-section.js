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
    <section className="relative overflow-hidden border-t border-border bg-[#f7faf8] py-20 dark:bg-background sm:py-24">
      <div className="marketing-container relative">
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-lg sm:p-8 lg:p-10">
          <div className="relative grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="marketing-eyebrow mb-5">
                Make your first CRM workflow in minutes
              </p>
              <h2 className="max-w-2xl text-4xl font-bold tracking-[-0.05em] text-foreground sm:text-5xl lg:text-[3.35rem] lg:leading-[1.02]">
                Replace scattered tools with one customer workspace
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                Bring contacts, conversations, tasks, and deals into a workspace your team can
                understand immediately. No messy setup, no scattered handoffs.
              </p>

              <div className="mt-7 space-y-3">
                {OUTCOMES.map((outcome) => (
                  <div key={outcome} className="flex items-center gap-3 text-sm font-semibold text-foreground">
                    <span className="flex size-6 items-center justify-center rounded-md bg-success-light text-success">
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
                <Button href="/contact" variant="outline" size="lg" className="w-full sm:w-auto">
                  Request guided demo
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <div className="rounded-md border border-border bg-card p-5 text-foreground shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-md bg-brand-light text-brand">
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
                      <span className={`size-2.5 rounded-sm ${color}`} />
                      <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-muted">
                        <div className={`h-full rounded-sm ${color}`} style={{ width: `${90 - index * 16}%` }} />
                      </div>
                      <span className="w-16 text-right text-xs font-semibold text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-md bg-ink p-4 text-ink-foreground">
                    <p className="text-2xl font-semibold">24h</p>
                    <p className="mt-1 text-xs opacity-70">faster handoffs</p>
                  </div>
                  <div className="rounded-md bg-success-light p-4 text-success">
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
