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
    <section className="border-y border-border bg-surface py-10">
      <div className="marketing-container text-center">
        <p className="text-sm font-semibold text-muted-foreground">Trusted by teams managing complex customer relationships</p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {COMPANIES.map((name) => (
            <span
              key={name}
              className="rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold tracking-tight text-muted-foreground shadow-sm"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
