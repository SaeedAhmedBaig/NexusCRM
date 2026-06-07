import { Button } from '../ui/button';
import { LineChartCta } from './ui/line-chart-cta';

export function CtaSection() {
  return (
    <section className="marketing-section border-t border-border bg-muted">
      <div className="marketing-container grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Ready for a governed CRM rollout?
          </h2>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Provision an isolated workspace, configure RBAC, and invite your team — or schedule a
            demo with our solutions team.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="/signup?plan=free" size="lg" className="w-full sm:w-auto">
              Start free workspace
            </Button>
            <Button href="/contact" variant="outline" size="lg" className="w-full sm:w-auto">
              Request a demo
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pipeline overview
          </p>
          <LineChartCta />
        </div>
      </div>
    </section>
  );
}
