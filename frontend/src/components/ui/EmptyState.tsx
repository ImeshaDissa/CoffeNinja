import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  readonly title: string;
  readonly description: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

/**
 * Displays a clear empty-state card when no inquiries exist or no records match active filters,
 * styled for both Light and Dark themes.
 *
 * @param props - EmptyState title, description, and optional primary CTA button.
 * @returns EmptyState card element.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps): React.JSX.Element {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-stone-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-1 max-w-md text-sm text-stone-500 dark:text-zinc-400">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center rounded-lg border border-teal-600/70 bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-700 shadow-sm transition hover:bg-teal-600 hover:text-white dark:border-teal-500/60 dark:bg-teal-950/60 dark:text-teal-300 dark:hover:bg-teal-600 dark:hover:text-white"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
