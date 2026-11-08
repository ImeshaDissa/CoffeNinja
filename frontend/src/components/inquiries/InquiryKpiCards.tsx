import React from 'react';
import {
  CheckCircle2,
  Clock,
  Inbox,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  INQUIRY_STATUS,
  InquiryStatus,
  InquiryStatusCounts,
} from '@/types/inquiry.types';

export interface InquiryKpiCardsProps {
  readonly counts: InquiryStatusCounts;
  readonly selectedStatus: InquiryStatus | 'ALL';
  readonly onSelectStatus: (status: InquiryStatus | 'ALL') => void;
}

/**
 * Renders the 4 top-level KPI summary cards with vertical accent bars, soft tinted icon badges,
 * and status metrics modeled after the reference dashboard design.
 *
 * @param props - Workspace status counts, active status filter, and click handler.
 * @returns 4-column KPI metric card grid.
 */
export function InquiryKpiCards({
  counts,
  selectedStatus,
  onSelectStatus,
}: InquiryKpiCardsProps): React.JSX.Element {
  const resolutionRate =
    counts.total > 0 ? Math.round((counts.RESOLVED / counts.total) * 100) : 0;
  const activeRate =
    counts.total > 0
      ? Math.round(((counts.NEW + counts.IN_PROGRESS) / counts.total) * 100)
      : 0;

  const cards = [
    {
      id: 'ALL' as const,
      label: 'Total Inquiries',
      value: counts.total,
      subtitle: `${activeRate}% Currently active`,
      accentBar: 'bg-teal-600 dark:bg-teal-400',
      iconBg:
        'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950/60 dark:text-teal-400 dark:border-teal-900/60',
      trendColor: 'text-teal-600 dark:text-teal-400',
      Icon: Inbox,
    },
    {
      id: INQUIRY_STATUS.NEW,
      label: 'New Inquiries',
      value: counts.NEW,
      subtitle: 'Awaiting initial triage',
      accentBar: 'bg-amber-500 dark:bg-amber-400',
      iconBg:
        'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900/60',
      trendColor: 'text-teal-600 dark:text-teal-400',
      Icon: Sparkles,
    },
    {
      id: INQUIRY_STATUS.IN_PROGRESS,
      label: 'In Progress',
      value: counts.IN_PROGRESS,
      subtitle: 'Assigned & being handled',
      accentBar: 'bg-orange-500 dark:bg-orange-400',
      iconBg:
        'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-900/60',
      trendColor: 'text-orange-600 dark:text-orange-400',
      Icon: Clock,
    },
    {
      id: INQUIRY_STATUS.RESOLVED,
      label: 'Resolved',
      value: counts.RESOLVED,
      subtitle: `${resolutionRate}% Resolution rate`,
      accentBar: 'bg-purple-600 dark:bg-purple-400',
      iconBg:
        'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-900/60',
      trendColor: 'text-teal-600 dark:text-teal-400',
      Icon: CheckCircle2,
    },
  ];

  return (
    <div
      aria-label="Inquiry summary metrics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card) => {
        const isSelected = selectedStatus === card.id;
        const IconComponent = card.Icon;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectStatus(card.id)}
            className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition ${
              isSelected
                ? 'border-teal-600/80 bg-white ring-2 ring-teal-500/15 dark:border-teal-400/80 dark:bg-zinc-900'
                : 'border-stone-200/90 bg-white hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex w-full items-start justify-between gap-3">
              <div className="flex items-stretch gap-3">
                <span
                  className={`w-1 shrink-0 rounded-full ${card.accentBar}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-medium text-stone-500 dark:text-zinc-400">
                    {card.label}
                  </p>
                  <p className="mt-1.5 text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50">
                    {card.value}
                  </p>
                </div>
              </div>

              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${card.iconBg}`}
              >
                <IconComponent className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-xs text-stone-500 dark:text-zinc-400">
              <TrendingUp
                className={`h-3.5 w-3.5 shrink-0 ${card.trendColor}`}
                aria-hidden="true"
              />
              <span>{card.subtitle}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

