import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const INTEGRATIONS = [
  'Slack',
  'Microsoft Teams',
  'Google Workspace',
  'Stripe',
  'HubSpot',
  'Salesforce',
  'Zapier',
  'Zendesk',
  'GitHub',
  'Jira',
  'Notion',
  'Twilio',
];

export function IntegrationsSection() {
  return (
    <section className="marketing-section border-t border-border bg-surface">
      <div className="marketing-container">
        <div className="marketing-section-header">
          <p className="marketing-eyebrow mb-4">Integrations</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
            Connect your existing stack
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Sync data across the tools your teams already use — without custom middleware or brittle
            automation chains.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {INTEGRATIONS.map((name) => (
            <div
              key={name}
              className="flex h-16 items-center justify-center rounded-2xl border border-border bg-card px-3 text-center text-sm font-semibold text-foreground shadow-sm"
            >
              {name}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View integration documentation
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
