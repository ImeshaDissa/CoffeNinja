import React from 'react';
import {
  INQUIRY_STATUS,
  InquiryStatus,
  STATUS_LABELS,
} from '@/types/inquiry.types';

export interface StatusBadgeProps {
  readonly status: InquiryStatus;
}

/**
 * Pill styling matching the soft rectangular pastel badges in the reference dashboard
 * (e.g. PENDING in warm amber, RUNNING in soft mint/teal, RESOLVED in soft emerald)
 * with full Dark Theme support.
 */
const STATUS_STYLES: Readonly<Record<InquiryStatus, string>> = {
  [INQUIRY_STATUS.NEW]:
    'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
  [INQUIRY_STATUS.IN_PROGRESS]:
    'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/60',
  [INQUIRY_STATUS.RESOLVED]:
    'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
};

/**
 * Displays a semantic badge for an inquiry's lifecycle status (NEW, IN PROGRESS, RESOLVED).
 *
 * @param props - Component props containing the inquiry status.
 * @returns Styled status badge element.
 */
export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={`inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
