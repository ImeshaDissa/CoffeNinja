import React from 'react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import {
  INQUIRY_STATUS,
  InquiryStatus,
  STATUS_LABELS,
} from '@/types/inquiry.types';

export interface InquiryFiltersProps {
  readonly selectedStatus: InquiryStatus | 'ALL';
  readonly searchQuery: string;
  readonly showCreateForm?: boolean;
  readonly onStatusChange: (status: InquiryStatus | 'ALL') => void;
  readonly onSearchChange: (search: string) => void;
  readonly onClearFilters: () => void;
  readonly onToggleCreateForm?: () => void;
}

const FILTER_TABS: ReadonlyArray<{
  readonly value: InquiryStatus | 'ALL';
  readonly label: string;
}> = [
  { value: 'ALL', label: 'All Inquiries' },
  { value: INQUIRY_STATUS.NEW, label: STATUS_LABELS[INQUIRY_STATUS.NEW] },
  {
    value: INQUIRY_STATUS.IN_PROGRESS,
    label: STATUS_LABELS[INQUIRY_STATUS.IN_PROGRESS],
  },
  { value: INQUIRY_STATUS.RESOLVED, label: STATUS_LABELS[INQUIRY_STATUS.RESOLVED] },
];

/**
 * Renders the search box on the left and the status filter + "+ Record Inquiry" CTA button
 * on the right, matching the reference dashboard toolbar layout.
 *
 * @param props - Active filter values, search input, and action handlers.
 * @returns Toolbar element.
 */
export function InquiryFilters({
  selectedStatus,
  searchQuery,
  showCreateForm = false,
  onStatusChange,
  onSearchChange,
  onClearFilters,
  onToggleCreateForm,
}: InquiryFiltersProps): React.JSX.Element {
  const hasActiveFilters = selectedStatus !== 'ALL' || searchQuery.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Search Box */}
        <div className="relative w-full sm:w-80">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-zinc-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search.."
            aria-label="Search inquiries"
            className="w-full rounded-lg border border-stone-200/90 bg-white py-2 pl-10 pr-8 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-teal-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search query"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-400 hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Right: Filter Select + "+ Record Inquiry" Teal Outlined Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <select
              aria-label="Filter by status dropdown"
              value={selectedStatus}
              onChange={(e) =>
                onStatusChange(e.target.value as InquiryStatus | 'ALL')
              }
              className="appearance-none rounded-lg border border-stone-200/90 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-stone-700 transition hover:border-stone-300 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {FILTER_TABS.map((tab) => (
                <option key={tab.value} value={tab.value}>
                  Filter: {tab.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500 dark:text-zinc-400"
              aria-hidden="true"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Reset
            </button>
          )}

          {onToggleCreateForm && (
            <button
              type="button"
              onClick={onToggleCreateForm}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600/70 bg-teal-50/70 px-3.5 py-2 text-xs font-semibold text-teal-700 shadow-sm transition hover:bg-teal-600 hover:text-white dark:border-teal-500/60 dark:bg-teal-950/60 dark:text-teal-300 dark:hover:bg-teal-600 dark:hover:text-white"
            >
              {showCreateForm ? (
                <>
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Close Form</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Record Inquiry</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Accessible Quick Status Pills */}
      <div
        role="tablist"
        aria-label="Filter inquiries by status"
        className="flex flex-wrap items-center gap-1.5"
      >
        {FILTER_TABS.map((tab) => {
          const isSelected = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onStatusChange(tab.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-sm dark:bg-teal-500 dark:text-zinc-950'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
