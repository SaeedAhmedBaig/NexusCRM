import dynamic from 'next/dynamic';
import { Hero } from '../components/marketing/hero';
import { SocialProof } from '../components/marketing/social-proof';
import { MarketingNav } from '../components/marketing/marketing-nav';
import { Footer } from '../components/marketing/footer';
import { fetchPublicPlans } from '../lib/plans';

const FeaturesGrid = dynamic(
  () => import('../components/marketing/features-grid').then((m) => ({ default: m.FeaturesGrid })),
);
const OnboardingSteps = dynamic(
  () => import('../components/marketing/onboarding-steps').then((m) => ({ default: m.OnboardingSteps })),
);
const StatsSection = dynamic(
  () => import('../components/marketing/stats-section').then((m) => ({ default: m.StatsSection })),
);
const IntegrationsSection = dynamic(
  () =>
    import('../components/marketing/integrations-section').then((m) => ({
      default: m.IntegrationsSection,
    })),
);
const PricingCards = dynamic(
  () => import('../components/marketing/pricing-cards').then((m) => ({ default: m.PricingCards })),
);
const Testimonials = dynamic(
  () => import('../components/marketing/testimonials').then((m) => ({ default: m.Testimonials })),
);
const FaqSection = dynamic(
  () => import('../components/marketing/faq-section').then((m) => ({ default: m.FaqSection })),
);
const CtaSection = dynamic(
  () => import('../components/marketing/cta-section').then((m) => ({ default: m.CtaSection })),
);

export const metadata = {
  title: 'NexusCRM — Enterprise multi-tenant CRM for revenue teams',
  description:
    'Unified sales, marketing, and service CRM with per-tenant isolation, RBAC, analytics, and centralized notifications. Start your free workspace.',
  openGraph: {
    title: 'NexusCRM — Enterprise CRM for revenue teams',
    description: 'Governed multi-tenant CRM with RBAC, audit trails, and SSO-ready access.',
    type: 'website',
  },
};

export default async function HomePage() {
  const plansData = await fetchPublicPlans();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <MarketingNav />
      <main className="flex-1">
        <Hero />
        <SocialProof />
        <FeaturesGrid />
        <OnboardingSteps />
        <StatsSection />
        <IntegrationsSection />
        <PricingCards plansData={plansData} />
        <Testimonials />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
