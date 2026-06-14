import { ArrowUpRight, Check, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

const OUTCOMES = [
  'Launch a shared CRM workspace in minutes',
  'Route every customer stage to the right owner',
  'Keep sales, support, and renewals in one journey',
];

const STAGES = [
  ['Capture', 'bg-[#ef5b4f]'],
  ['Qualify', 'bg-[#3577dc]'],
  ['Guide', 'bg-[#20a45a]'],
  ['Retain', 'bg-[#d79b11]'],
];

export function CtaSection() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-[#f3f5f9] py-20 sm:py-24">
      <div className="marketing-container relative">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#202126] bg-[#101114] p-6 text-white shadow-[0_28px_90px_rgba(15,23,42,0.24)] sm:p-8 lg:p-10">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#ef5b4f]/25 blur-3xl" />
          <div className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-[#3577dc]/20 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_0.86fr] lg:items-center">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                Ready when your team is
              </p>
              <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.35rem] lg:leading-[1.02]">
                Start with a cleaner way to run customer relationships
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
                Bring contacts, conversations, tasks, and deals into a workspace your team can
                understand immediately. No messy setup, no scattered handoffs.
              </p>

              <div className="mt-7 space-y-3">
                {OUTCOMES.map((outcome) => (
                  <div key={outcome} className="flex items-center gap-3 text-sm font-medium text-white/80">
                    <span className="flex size-6 items-center justify-center rounded-full bg-white/10 text-[#20a45a]">
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
                <Button href="/contact" variant="outline" size="lg" className="w-full border-white/20 bg-white/[0.08] text-white hover:bg-white/[0.12] sm:w-auto">
                  Request guided demo
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/12 bg-white/[0.07] p-5">
              <div className="rounded-[1.6rem] bg-white p-5 text-[#101114] shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-[#fde5dd] text-[#ef5b4f]">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">From first touch to renewal</p>
                    <p className="text-xs text-[#667085]">A clear path for every customer stage.</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {STAGES.map(([label, color], index) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className={`size-3 rounded-full ${color}`} />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8edf4]">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${90 - index * 16}%` }} />
                      </div>
                      <span className="w-16 text-right text-xs font-semibold text-[#667085]">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-3xl bg-[#101114] p-4 text-white">
                    <p className="text-2xl font-semibold">24h</p>
                    <p className="mt-1 text-xs text-white/60">faster handoffs</p>
                  </div>
                  <div className="rounded-3xl bg-[#ddf3e5] p-4 text-[#137a3d]">
                    <p className="text-2xl font-semibold">98%</p>
                    <p className="mt-1 text-xs text-[#137a3d]/70">task visibility</p>
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
