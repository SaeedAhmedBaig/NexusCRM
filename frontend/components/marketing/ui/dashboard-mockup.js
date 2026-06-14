'use client';

import { Fragment } from 'react';
import { ArrowRight, CircleCheck, MessageCircle, MousePointerClick, Sparkles } from 'lucide-react';

const STAGES = [
  { label: 'First touch', color: 'bg-[#ef5b4f]', soft: 'bg-[#fde5dd]' },
  { label: 'Engaged', color: 'bg-[#3577dc]', soft: 'bg-[#deebff]' },
  { label: 'Qualified', color: 'bg-[#20a45a]', soft: 'bg-[#ddf3e5]' },
  { label: 'Expansion', color: 'bg-[#d79b11]', soft: 'bg-[#fff0bd]' },
];

const SIGNALS = [
  { icon: MousePointerClick, label: 'Pricing viewed', color: 'text-[#ef5b4f]', bg: 'bg-[#fde5dd]' },
  { icon: MessageCircle, label: 'Reply received', color: 'text-[#3577dc]', bg: 'bg-[#deebff]' },
  { icon: CircleCheck, label: 'Task completed', color: 'text-[#20a45a]', bg: 'bg-[#ddf3e5]' },
];

export function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-[620px] rounded-[2.5rem] border border-white/85 bg-white/70 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.16)] backdrop-blur">
      <div className="absolute -right-12 -top-12 size-40 rounded-full bg-[#ef5b4f]/16 blur-3xl" />
      <div className="absolute -bottom-14 left-8 size-44 rounded-full bg-[#3577dc]/12 blur-3xl" />

      <div className="relative rounded-[2rem] border border-[#dde4ee] bg-[#f8fafc] p-5 text-[#101114]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Journey architecture</p>
            <p className="mt-1 text-xs text-[#667085]">An abstract view of how customer signals become action.</p>
          </div>
          <span className="rounded-full bg-[#101114] px-3 py-1 text-xs font-semibold text-white">Live flow</span>
        </div>

        <div className="mt-8 grid gap-5">
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
            {STAGES.slice(0, 3).map((stage, index) => (
              <Fragment key={stage.label}>
                <div className={`rounded-[1.5rem] border border-white bg-white p-4 shadow-sm ${stage.soft}`}>
                  <span className={`mb-4 block size-3 rounded-full ${stage.color}`} />
                  <p className="text-sm font-semibold">{stage.label}</p>
                  <p className="mt-1 text-[11px] text-[#667085]">Signal captured</p>
                </div>
                {index < 2 && (
                  <div className="flex items-center justify-center text-[#7b8494]">
                    <ArrowRight className="size-4" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>

          <div className="grid gap-3 rounded-[1.75rem] bg-white p-4 shadow-sm sm:grid-cols-3">
            {SIGNALS.map((signal) => {
              const Icon = signal.icon;
              return (
                <div key={signal.label} className="flex items-center gap-3">
                  <span className={`flex size-9 items-center justify-center rounded-full ${signal.bg}`}>
                    <Icon className={`size-4 ${signal.color}`} />
                  </span>
                  <p className="text-xs font-semibold">{signal.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_0.78fr]">
            <div className="rounded-[1.75rem] bg-[#101114] p-4 text-white">
              <Sparkles className="size-4 text-[#ef5b4f]" />
              <p className="mt-4 text-lg font-semibold">Next best action</p>
              <p className="mt-1 text-xs leading-relaxed text-white/58">
                Prioritize accounts by intent, health, and ownership without showing another dashboard screenshot.
              </p>
            </div>
            <div className="rounded-[1.75rem] bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-[#667085]">Semantic status</p>
              <div className="mt-4 space-y-2">
                {STAGES.map((stage) => (
                  <div key={stage.label} className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${stage.color}`} />
                    <span className="text-xs font-medium">{stage.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
