import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Inquiry } from '@/types/inquiry.types';

export interface InquiryListProps {
  readonly inquiries: readonly Inquiry[];
}

/**
 * Formats an ISO timestamp string into a concise human-readable date string (e.g. "Nov 08, 2026").
 *
 * @param isoDate - ISO 8601 date string.
 * @returns Formatted date string.
 */
export function formatInquiryTimestamp(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

/**
 * Renders the customer inquiries inside a sleek, single-container row layout
 * (Subject + Created date on left, Customer, Contact, Handled By, and Status badge at the end).
 *
 * @param props - Array of Inquiry objects to display.
 * @returns Structured InquiryList container element.
 */
export function InquiryList({ inquiries }: InquiryListProps): React.JSX.Element {
  return (
    <div
      data-testid="inquiry-list"
      className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200/90 bg-white shadow-sm dark:divide-zinc-800/80 dark:border-zinc-800 dark:bg-zinc-900"
    >
      {inquiries.map((inquiry) => (
        <Link
          key={inquiry.id}
          href={`/inquiries/${inquiry.id}`}
          className="group grid grid-cols-1 items-center gap-4 px-5 py-4 transition hover:bg-stone-50/90 dark:hover:bg-zinc-800/50 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_140px]"
        >
          {/* Column 1: Primary Subject & Created Date */}
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-stone-900 transition group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-400">
              {inquiry.subject}
            </h3>
            <p className="mt-1 truncate text-xs text-stone-400 dark:text-zinc-500">
              Created on: {formatInquiryTimestamp(inquiry.createdAt)} •{' '}
              {inquiry.description}
            </p>
            {inquiry.resolutionNote && (
              <p className="mt-1 truncate text-[11px] font-medium text-teal-700 dark:text-teal-400">
                Last note: {inquiry.resolutionNote}
              </p>
            )}
          </div>

          {/* Column 2: Customer Name */}
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-stone-400 dark:text-zinc-500">
              Customer
            </p>
            <p className="mt-0.5 truncate text-sm font-bold text-stone-800 dark:text-zinc-100">
              {inquiry.customerName}
            </p>
          </div>

          {/* Column 3: Contact Channel */}
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-stone-400 dark:text-zinc-500">
              Contact
            </p>
            <p className="mt-0.5 truncate text-xs font-bold text-stone-800 dark:text-zinc-200">
              {inquiry.contactInfo}
            </p>
          </div>

          {/* Column 4: Handled By with Vertical Divider */}
          <div className="min-w-0 border-stone-200 dark:border-zinc-800 lg:border-r lg:pr-4">
            <p className="text-[11px] font-medium text-stone-400 dark:text-zinc-500">
              Handled By
            </p>
            <p className="mt-0.5 truncate text-sm font-bold text-stone-800 dark:text-zinc-100">
              {inquiry.owner.name.replace(/\s*\(.*?\)/, '')}
            </p>
          </div>

          {/* Column 5: Status Pill at the End of the Columns */}
          <div className="flex flex-col items-start lg:pl-2">
            <span className="mb-1 text-[11px] font-medium text-stone-400 dark:text-zinc-500">
              Status
            </span>
            <StatusBadge status={inquiry.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
