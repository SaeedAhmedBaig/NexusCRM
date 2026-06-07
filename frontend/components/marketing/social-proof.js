const COMPANIES = [
  'Meridian Industries',
  'Northline Group',
  'Apex Systems',
  'Horizon Partners',
  'Summit Holdings',
  'Vantage Corp',
];

export function SocialProof() {
  return (
    <section className="border-y border-border bg-muted/50 py-10">
      <div className="marketing-container text-center">
        <p className="text-sm font-medium text-muted-foreground">Trusted by revenue teams</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {COMPANIES.map((name) => (
            <span
              key={name}
              className="text-sm font-medium tracking-tight text-muted-foreground/70"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
