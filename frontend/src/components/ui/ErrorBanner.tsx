import React from 'react';
import Link from 'next/link';
import { AlertCircle, AlertTriangle, RefreshCw, X } from 'lucide-react';

export interface ErrorBannerProps {
  readonly title?: string;
  readonly message: string;
  readonly variant?: 'error' | 'warning';
  readonly correlationId?: string;
  readonly actionLink?: {
    readonly href: string;
    readonly label: string;
  };
  readonly onRetry?: () => void;
  readonly onDismiss?: () => void;
}

/**
 * Renders a structured error or warning alert banner with optional retry, link, and dismiss actions,
 * supporting both Light and Dark themes.
 *
 * @param props - ErrorBanner configuration props.
 * @returns Accessible alert banner element.
 */
export function ErrorBanner({
  title,
  message,
  variant = 'error',
  correlationId,
  actionLink,
  onRetry,
  onDismiss,
}: ErrorBannerProps): React.JSX.Element {
  const isWarning = variant === 'warning';
  const containerClasses = isWarning
    ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/50 dark:text-amber-200'
    : 'border-red-300 bg-red-50 text-red-900 dark:border-red-800/80 dark:bg-red-950/50 dark:text-red-200';

  const IconComponent = isWarning ? AlertTriangle : AlertCircle;
  const iconColor = isWarning
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div
      role="alert"
      className={`rounded-xl border p-4 shadow-sm ${containerClasses}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <IconComponent className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
          <div className="space-y-1 text-sm">
            {title && <p className="font-semibold">{title}</p>}
            <p className="leading-relaxed">{message}</p>
            {correlationId && (
              <p className="text-xs opacity-75">Reference ID: {correlationId}</p>
            )}
            {(actionLink || onRetry) && (
              <div className="mt-2 flex flex-wrap items-center gap-3 pt-1">
                {actionLink && (
                  <Link
                    href={actionLink.href}
                    className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-sm ring-1 ring-inset ring-stone-300 hover:bg-stone-50 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-700"
                  >
                    {actionLink.label}
                  </Link>
                )}
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-sm ring-1 ring-inset ring-stone-300 hover:bg-stone-50 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss alert"
            className="rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
