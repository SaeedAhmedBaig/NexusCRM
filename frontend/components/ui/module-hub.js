'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import { Badge } from './badge';
import { getTenantUrl } from '../../lib/tenant';

export function ModuleHub({ title, description, features = [], relatedLinks = [], comingSoon = false }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {comingSoon && <Badge variant="warning">Coming soon</Badge>}
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>
      </div>

      {features.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{f.title}</CardTitle>
                {f.description && <CardDescription>{f.description}</CardDescription>}
              </CardHeader>
              {f.items?.length > 0 && (
                <CardContent>
                  <ul className="space-y-1.5 text-sm text-muted">
                    {f.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-brand" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {relatedLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available now</CardTitle>
            <CardDescription>Use these modules while we build out this area</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand/30 hover:bg-brand-subtle"
              >
                {link.label}
                <ArrowRight className="h-3.5 w-3.5 text-muted" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function useTenantModuleLinks(subdomain) {
  return (path) => getTenantUrl(subdomain, path);
}
