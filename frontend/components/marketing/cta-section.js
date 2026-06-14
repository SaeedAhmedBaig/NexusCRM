import { ArrowUpRight, Calendar, Check, Mail, MessageCircle, Plus, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

const JOURNEY_TASKS = [
  { label: 'Identify issue category', owner: 'SA', tone: 'bg-blue-500' },
  { label: 'Estimate resolution time', owner: 'MK', tone: 'bg-orange-500' },
  { label: 'Advise customer of next step', owner: 'JR', tone: 'bg-rose-500' },
];

const PLAYBOOKS = ['Request processing', 'Problem resolution', 'Customer communication', 'Satisfaction review'];

export function CtaSection() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-background py-20 sm:py-24">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/55 to-transparent" />
      <div className="marketing-container relative">
        <div className="overflow-hidden rounded-[2.75rem] border border-white/70 bg-[#111113] p-4 text-white shadow-[0_28px_90px_rgba(15,23,42,0.20)] sm:p-6">
          <div className="relative overflow-hidden rounded-[2.25rem] bg-[#e8edf5] p-5 text-foreground sm:p-8 lg:p-10">
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
            <div className="absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-blue-400/15 blur-3xl" />

            <div className="relative grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div>
                <p className="marketing-eyebrow mb-5 border-white/80 bg-white/70">
                  Journey command center
                </p>
                <h2 className="max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem] lg:leading-[1.02]">
                  Build the workflow your customers actually follow
                </h2>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
                  Turn leads, tickets, tasks, and renewals into one visual operating board. Give every
                  team the next action, owner, and customer context without digging through tabs.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:max-w-lg">
                  {[
                    ['24h', 'faster handoffs'],
                    ['5', 'journey stages'],
                    ['98%', 'task visibility'],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-3xl border border-white/75 bg-white/70 p-4 shadow-sm">
                      <p className="text-2xl font-semibold tracking-tight">{value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button href="/signup?plan=free" size="lg" className="w-full sm:w-auto">
                    Start journey workspace
                    <ArrowUpRight className="size-4" />
                  </Button>
                  <Button href="/contact" variant="outline" size="lg" className="w-full bg-white/70 sm:w-auto">
                    Request guided demo
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-6 top-10 hidden h-[70%] w-px bg-[#b8c2d3] lg:block" />
                <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="rounded-[2rem] border border-white/80 bg-white/78 p-4 shadow-sm backdrop-blur">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">Issue identification</p>
                          <p className="text-xs text-muted-foreground">Support journey stage</p>
                        </div>
                        <div className="flex -space-x-2">
                          {['S', 'M', 'J'].map((avatar, index) => (
                            <span
                              key={avatar}
                              className={`flex size-9 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white ${
                                ['bg-blue-500', 'bg-orange-500', 'bg-rose-500'][index]
                              }`}
                            >
                              {avatar}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {JOURNEY_TASKS.map((task) => (
                          <div key={task.label} className="flex items-center gap-3 rounded-2xl bg-[#f7f9fc] p-3">
                            <span className={`flex size-9 items-center justify-center rounded-full ${task.tone} text-xs font-semibold text-white`}>
                              {task.owner}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{task.label}</p>
                              <p className="text-xs text-muted-foreground">Auto-assigned from customer signal</p>
                            </div>
                            <Calendar className="size-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-white/80 bg-white/65 p-4 shadow-sm backdrop-blur">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Customer touchpoints</p>
                        <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                          Live
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {[
                          [Mail, 'Email sent'],
                          [MessageCircle, 'Reply logged'],
                          [Check, 'SLA met'],
                        ].map(([Icon, label]) => (
                          <div key={label} className="rounded-2xl bg-white/80 p-3 text-center">
                            <Icon className="mx-auto size-4 text-foreground" />
                            <p className="mt-2 text-[11px] font-medium text-muted-foreground">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/80 bg-white/72 p-4 shadow-sm backdrop-blur">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">New tasks</p>
                        <p className="text-xs text-muted-foreground">Generated playbook</p>
                      </div>
                      <button className="flex size-10 items-center justify-center rounded-full border border-border bg-white shadow-sm">
                        <Plus className="size-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {PLAYBOOKS.map((item, index) => (
                        <div
                          key={item}
                          className={`min-h-24 rounded-3xl p-4 text-sm font-semibold ${
                            index === 0 ? 'bg-foreground text-background shadow-lg' : 'bg-[#f7f9fc] text-foreground'
                          }`}
                        >
                          {index === 0 && <Sparkles className="mb-3 size-4 text-brand" />}
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-3xl bg-[#f7f9fc] p-4">
                      <p className="text-xs font-medium text-muted-foreground">Resolution velocity</p>
                      <div className="mt-3 flex h-16 items-end gap-1.5">
                        {[34, 48, 42, 64, 58, 76, 88].map((height, index) => (
                          <span
                            key={index}
                            className={`flex-1 rounded-t-full ${index === 6 ? 'bg-brand' : 'bg-[#cbd5e1]'}`}
                            style={{ height }}
                          />
                        ))}
                      </div>
                    </div>
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
