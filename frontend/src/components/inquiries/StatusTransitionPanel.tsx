'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Lock } from 'lucide-react';
import {
  INQUIRY_STATUS,
  Inquiry,
  InquiryStatus,
  STATUS_LABELS,
} from '@/types/inquiry.types';

export interface StatusTransitionPanelProps {
  readonly inquiry: Inquiry;
  readonly isUpdating: boolean;
  readonly onTransition: (
    nextStatus: InquiryStatus,
    resolutionNote: string
  ) => Promise<void>;
}

const LIFECYCLE_STEPS: readonly InquiryStatus[] = [
  INQUIRY_STATUS.NEW,
  INQUIRY_STATUS.IN_PROGRESS,
  INQUIRY_STATUS.RESOLVED,
];

/**
 * Renders the Inquiry Lifecycle stepper and valid next-status transition controls
 * with full Light and Dark theme support.
 *
 * @param props - Current Inquiry, loading indicator, and transition callback.
 * @returns Lifecycle transition panel element.
 */
export function StatusTransitionPanel({
  inquiry,
  isUpdating,
  onTransition,
}: StatusTransitionPanelProps): React.JSX.Element {
  const [note, setNote] = useState<string>(inquiry.resolutionNote ?? '');

  useEffect(() => {
    setNote(inquiry.resolutionNote ?? '');
  }, [inquiry.resolutionNote, inquiry.version]);

  const currentStepIndex = LIFECYCLE_STEPS.indexOf(inquiry.status);
  const isTerminal = inquiry.allowedTransitions.length === 0;

  return (
    <section
      aria-labelledby="lifecycle-heading"
      className="rounded-xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2
            id="lifecycle-heading"
            className="text-base font-semibold text-stone-900 dark:text-zinc-100"
          >
            Inquiry Lifecycle
          </h2>
          <p className="text-xs text-stone-500 dark:text-zinc-400">
            Inquiries progress strictly forward from New → In Progress → Resolved.
          </p>
        </div>
        <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-mono text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
          Record Version: v{inquiry.version}
        </span>
      </div>

      {/* Visual Stepper */}
      <ol className="mt-5 grid grid-cols-3 gap-2">
        {LIFECYCLE_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          return (
            <li
              key={step}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold ${
                isCurrent
                  ? 'border-teal-600 bg-teal-600 text-white shadow-sm dark:border-teal-500 dark:bg-teal-500 dark:text-zinc-950'
                  : isCompleted
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'border-stone-200 bg-stone-50 text-stone-400 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-500'
              }`}
            >
              <CheckCircle2
                className={`h-4 w-4 shrink-0 ${
                  isCurrent
                    ? 'text-white dark:text-zinc-950'
                    : isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-stone-300 dark:text-zinc-600'
                }`}
                aria-hidden="true"
              />
              <span>{STATUS_LABELS[step]}</span>
            </li>
          );
        })}
      </ol>

      {isTerminal ? (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300">
          <Lock
            className="mt-0.5 h-4 w-4 shrink-0 text-stone-500 dark:text-zinc-400"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold text-stone-900 dark:text-zinc-100">
              This inquiry is Resolved and closed.
            </p>
            <p className="mt-0.5 text-xs text-stone-600 dark:text-zinc-400">
              Resolved inquiries cannot be reopened so the resolution history stays
              reliable. If the customer reaches out with a new issue, record a new
              inquiry.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4 border-t border-stone-100 pt-5 dark:border-zinc-800">
          <div>
            <label
              htmlFor="resolutionNote"
              className="block text-sm font-semibold text-stone-800 dark:text-zinc-200"
            >
              Progress / Resolution Note{' '}
              <span className="font-normal text-stone-500 dark:text-zinc-400">
                (Optional — records what happened last)
              </span>
            </label>
            <textarea
              id="resolutionNote"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              placeholder={
                inquiry.status === INQUIRY_STATUS.NEW
                  ? 'e.g. Called customer to confirm appointment details...'
                  : 'e.g. Sent replacement invoice and confirmed delivery...'
              }
              className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {inquiry.allowedTransitions.map((nextStatus) => (
              <button
                key={nextStatus}
                type="button"
                disabled={isUpdating}
                onClick={() => void onTransition(nextStatus, note)}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                )}
                <span>Mark as {STATUS_LABELS[nextStatus]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
