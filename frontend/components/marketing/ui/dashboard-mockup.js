'use client';

const ROWS = [
  ['Lead qualification', 'Sales', 'In progress', 'Apr 04'],
  ['Quote approval', 'Finance', 'Waiting', 'Apr 06'],
  ['Ticket escalation', 'Support', 'Urgent', 'Today'],
  ['Renewal campaign', 'Marketing', 'Ready', 'Apr 09'],
];

const METRICS = [
  ['Pending workflows', '11/15', 'bg-info'],
  ['Converted leads', '08/50', 'bg-brand'],
  ['Projects in progress', '05/05', 'bg-success'],
  ['Tasks not finished', '48/64', 'bg-warning'],
];

export function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-5xl rounded-xl border border-border bg-card p-3 shadow-lg">
      <div className="grid gap-3 rounded-lg border border-border bg-background p-3 text-foreground lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-card px-4 py-3">
          <div>
              <p className="text-sm font-bold">Dashboard</p>
              <p className="text-xs text-muted-foreground">Client update · 1 minute ago</p>
          </div>
            <button className="rounded-md bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground">Manage widgets</button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {METRICS.map(([label, value, color]) => (
              <div key={label} className="rounded-md border border-border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
                <div className="mt-3 grid grid-cols-5 gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index} className={`h-1.5 rounded-sm ${index < 3 ? color : 'bg-muted'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-bold">Latest activity</p>
              <span className="text-xs font-semibold text-muted-foreground">See all</span>
            </div>
            <div className="overflow-hidden">
              {ROWS.map(([name, team, status, date], index) => (
                <div key={name} className="grid grid-cols-[1.4fr_0.9fr_0.9fr_0.7fr] gap-3 border-b border-border/70 px-4 py-3 text-xs last:border-b-0">
                  <span className="font-semibold text-foreground">{String(index + 1).padStart(2, '0')} · {name}</span>
                  <span className="text-muted-foreground">{team}</span>
                  <span className="font-semibold text-foreground">{status}</span>
                  <span className="text-right text-muted-foreground">{date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-sm font-bold">To-do items</p>
            <div className="mt-4 space-y-3">
              {['Text inputs for Design System', 'Invoice UX review', 'CRM module QA'].map((task, index) => (
                <label key={task} className="flex gap-2 text-xs">
                  <input type="checkbox" className="mt-0.5 rounded border-border" defaultChecked={index === 2} readOnly />
                  <span>
                    <span className="block font-semibold text-foreground">{task}</span>
                    <span className="text-muted-foreground">Assigned to product team</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-sm font-bold">Records overview</p>
            <div className="mt-4 space-y-3">
              {[
                ['Draft', '20%', 'bg-muted'],
                ['Not sent', '88%', 'bg-warning'],
                ['Paid', '76%', 'bg-success'],
              ].map(([label, width, color]) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold text-foreground">{label}</span>
                    <span className="text-muted-foreground">{width}</span>
                  </div>
                  <div className="h-1.5 rounded-sm bg-muted">
                    <div className={`h-full rounded-sm ${color}`} style={{ width }} />
                  </div>
                </div>
                ))}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
