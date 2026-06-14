import Link from 'next/link';
import { Logo } from './logo';

const PRODUCT = [
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/signup?plan=free', label: 'Free workspace' },
];
const COMPANY = [
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];
const LEGAL = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
];

const COLUMNS = [
  { title: 'Product', links: PRODUCT },
  { title: 'Company', links: COMPANY },
  { title: 'Legal', links: LEGAL },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#111113] text-white">
      <div className="marketing-container py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Customer journey CRM for mapping every account from first touch to renewal, with
              governed tenant workspaces and live journey intelligence.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white">
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <p className="text-center text-sm text-white/50">
            &copy; {new Date().getFullYear()} NexusCRM. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
