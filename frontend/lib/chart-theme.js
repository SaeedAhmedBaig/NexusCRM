'use client';

import { useEffect, useState } from 'react';

const FALLBACK = {
  grid: '#f4f4f5',
  text: '#a1a1aa',
  brand: '#e25626',
  brandForeground: '#ffffff',
  palette: ['#e25626', '#3b82f6', '#16a34a', '#8b5cf6', '#71717a', '#a1a1aa'],
  funnel: {
    track: '#f4f4f5',
    lead: '#3f3f46',
    qualified: '#52525b',
    proposal: '#71717a',
    negotiation: '#a1a1aa',
    won: '#16a34a',
    lost: '#e4e4e7',
    lostText: '#a1a1aa',
  },
  tooltipBg: '#ffffff',
  tooltipBorder: '#e4e4e7',
  tooltipText: '#18181b',
};

function readVar(style, name, fallback) {
  const v = style.getPropertyValue(name).trim();
  return v || fallback;
}

export function getChartColors() {
  if (typeof window === 'undefined') return FALLBACK;

  const style = getComputedStyle(document.documentElement);
  const palette = [
    readVar(style, '--chart-1', FALLBACK.palette[0]),
    readVar(style, '--chart-2', FALLBACK.palette[1]),
    readVar(style, '--chart-3', FALLBACK.palette[2]),
    readVar(style, '--chart-4', FALLBACK.palette[3]),
    readVar(style, '--chart-5', FALLBACK.palette[4]),
    readVar(style, '--chart-6', FALLBACK.palette[5]),
  ];

  return {
    grid: readVar(style, '--chart-grid', FALLBACK.grid),
    text: readVar(style, '--chart-text', FALLBACK.text),
    brand: readVar(style, '--brand', FALLBACK.brand),
    brandForeground: readVar(style, '--brand-foreground', FALLBACK.brandForeground),
    palette,
    funnel: {
      track: readVar(style, '--funnel-track', FALLBACK.funnel.track),
      lead: readVar(style, '--funnel-1', FALLBACK.funnel.lead),
      qualified: readVar(style, '--funnel-2', FALLBACK.funnel.qualified),
      proposal: readVar(style, '--funnel-3', FALLBACK.funnel.proposal),
      negotiation: readVar(style, '--funnel-4', FALLBACK.funnel.negotiation),
      won: readVar(style, '--funnel-won', FALLBACK.funnel.won),
      lost: readVar(style, '--funnel-lost', FALLBACK.funnel.lost),
      lostText: readVar(style, '--funnel-lost-text', FALLBACK.funnel.lostText),
    },
    tooltipBg: readVar(style, '--card', FALLBACK.tooltipBg),
    tooltipBorder: readVar(style, '--border', FALLBACK.tooltipBorder),
    tooltipText: readVar(style, '--foreground', FALLBACK.tooltipText),
  };
}

export function getFunnelStageColor(colors, key, index) {
  const map = {
    lead: colors.funnel.lead,
    qualified: colors.funnel.qualified,
    proposal: colors.funnel.proposal,
    negotiation: colors.funnel.negotiation,
    won: colors.funnel.won,
    lost: colors.funnel.lost,
  };
  return map[key] || colors.palette[index % colors.palette.length];
}

export function useChartColors() {
  const [colors, setColors] = useState(getChartColors);

  useEffect(() => {
    setColors(getChartColors());
    const observer = new MutationObserver(() => setColors(getChartColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setColors(getChartColors());
    mq.addEventListener('change', onChange);
    return () => {
      observer.disconnect();
      mq.removeEventListener('change', onChange);
    };
  }, []);

  return colors;
}

export function chartJsDefaults(colors) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: colors.text,
          font: { size: 11 },
          boxWidth: 12,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        titleColor: colors.tooltipText,
        bodyColor: colors.text,
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        grid: { color: colors.grid, drawBorder: false },
        ticks: { color: colors.text, font: { size: 11 } },
      },
      y: {
        grid: { color: colors.grid, drawBorder: false },
        ticks: { color: colors.text, font: { size: 11 } },
      },
    },
  };
}
