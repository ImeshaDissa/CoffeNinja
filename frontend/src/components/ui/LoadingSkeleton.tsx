import React from 'react';

export interface LoadingSkeletonProps {
  readonly rows?: number;
}

/**
 * Renders animated placeholder rows while inquiry data is loading from the API,
 * supporting both Light and Dark themes.
 *
 * @param props - Number of skeleton rows to render.
 * @returns Accessible loading skeleton container.
 */
export function LoadingSkeleton({
  rows = 4,
}: LoadingSkeletonProps): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="Loading inquiries"
      data-testid="loading-skeleton"
      className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200/90 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse flex-wrap items-center justify-between gap-4 px-5 py-4"
        >
          <div className="space-y-2">
            <div className="h-4 w-56 rounded bg-stone-200 dark:bg-zinc-800" />
            <div className="h-3 w-40 rounded bg-stone-100 dark:bg-zinc-800/70" />
          </div>
          <div className="h-6 w-20 rounded-md bg-stone-100 dark:bg-zinc-800" />
          <div className="h-4 w-28 rounded bg-stone-100 dark:bg-zinc-800" />
          <div className="h-6 w-11 rounded-full bg-stone-200 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}
