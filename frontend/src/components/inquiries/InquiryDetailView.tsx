'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Mail,
  RefreshCw,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { formatInquiryTimestamp } from '@/components/inquiries/InquiryList';
import { StatusTransitionPanel } from '@/components/inquiries/StatusTransitionPanel';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  apiClient,
  ApiClientError,
  IApiClient,
} from '@/services/api-client';
import {
  ERROR_CODE,
  Inquiry,
  InquiryStatus,
  STATUS_LABELS,
} from '@/types/inquiry.types';

export interface InquiryDetailViewProps {
  readonly inquiryId: string;
  readonly client?: IApiClient;
}

/**
 * Core Inquiry Detail and Lifecycle view component with full Light and Dark theme support.
 * Handles loading states, 403/404/400 boundary errors, status transitions,
 * and 409 STALE_DATA concurrency recovery across browser tabs.
 *
 * @param props - Target inquiryId and optional injected API client (for testing).
 * @returns Inquiry detail view element.
 */
export function InquiryDetailView({
  inquiryId,
  client = apiClient,
}: InquiryDetailViewProps): React.JSX.Element {
  const router = useRouter();
  const routerRef = React.useRef(router);
  routerRef.current = router;

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const [loadError, setLoadError] = useState<{
    statusCode: number;
    title: string;
    message: string;
    correlationId?: string;
  } | null>(null);

  const [transitionFeedback, setTransitionFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    correlationId?: string;
  } | null>(null);

  /**
   * Loads the inquiry record from the backend API.
   *
   * @param silent - When true, refreshes without replacing the current view with a skeleton.
   */
  const fetchInquiryDetail = useCallback(
    async (silent = false): Promise<void> => {
      if (!silent) {
        setIsLoading(true);
      }
      setLoadError(null);

      try {
        const fetched = await client.getInquiryById(inquiryId);
        setInquiry(fetched);
      } catch (error) {
        if (error instanceof ApiClientError) {
          if (error.statusCode === 401) {
            routerRef.current.replace('/login');
            return;
          }

          const titleMap: Record<number, string> = {
            400: 'Invalid Inquiry ID Format',
            403: 'Access Restricted (403 Forbidden)',
            404: 'Inquiry Not Found (404)',
          };

          setLoadError({
            statusCode: error.statusCode,
            title: titleMap[error.statusCode] ?? 'Unable to Load Inquiry',
            message: error.message,
            correlationId: error.correlationId,
          });
        } else {
          setLoadError({
            statusCode: 500,
            title: 'Network Error',
            message: 'Unable to retrieve the inquiry details right now.',
          });
        }
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [inquiryId, client]
  );

  useEffect(() => {
    void fetchInquiryDetail(false);
  }, [fetchInquiryDetail]);

  /**
   * Proactively refreshes inquiry data when the browser tab regains focus.
   */
  useEffect(() => {
    const handleWindowFocus = (): void => {
      if (inquiry) {
        void fetchInquiryDetail(true);
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [inquiry, fetchInquiryDetail]);

  /**
   * Submits a status transition with optimistic concurrency version verification.
   * If another tab updated the inquiry first (409 STALE_DATA), refreshes the UI
   * with the latest server state and explains what happened.
   *
   * @param nextStatus - Target lifecycle status.
   * @param resolutionNote - Optional staff progress or resolution note.
   */
  const handleStatusTransition = async (
    nextStatus: InquiryStatus,
    resolutionNote: string
  ): Promise<void> => {
    if (!inquiry) {
      return;
    }

    setIsUpdating(true);
    setTransitionFeedback(null);

    try {
      const updated = await client.updateInquiryStatus(inquiry.id, {
        status: nextStatus,
        expectedVersion: inquiry.version,
        resolutionNote,
      });

      setInquiry(updated);
      setTransitionFeedback({
        type: 'success',
        title: 'Status Updated',
        message: `Inquiry status is now "${STATUS_LABELS[updated.status]}" (Version v${updated.version}).`,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === ERROR_CODE.STALE_DATA) {
          if (error.details?.latestInquiry) {
            setInquiry(error.details.latestInquiry);
          } else {
            await fetchInquiryDetail(true);
          }

          setTransitionFeedback({
            type: 'warning',
            title: 'Stale Data Detected (Updated in Another Tab)',
            message: error.message,
            correlationId: error.correlationId,
          });
          return;
        }

        setTransitionFeedback({
          type: 'error',
          title: 'Status Change Rejected',
          message: error.message,
          correlationId: error.correlationId,
        });
        return;
      }

      setTransitionFeedback({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save the status change. Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (loadError || !inquiry) {
    return (
      <div className="space-y-5">
        <Link
          href="/inquiries"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700 hover:text-stone-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Inquiries Overview
        </Link>

        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-stone-900 dark:text-zinc-100">
            {loadError?.title ?? 'Inquiry Unavailable'}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-600 dark:text-zinc-400">
            {loadError?.message}
          </p>
          {loadError?.correlationId && (
            <p className="mt-2 text-xs text-stone-400 dark:text-zinc-500">
              Reference ID: {loadError.correlationId}
            </p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/inquiries"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              Return to My Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Manual Refresh */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/inquiries"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700 hover:text-stone-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Inquiries Overview
        </Link>

        <button
          type="button"
          onClick={() => void fetchInquiryDetail(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Sync Latest State
        </button>
      </div>

      {/* Feedback Banner (Success, Stale-Data Warning, or Error) */}
      {transitionFeedback &&
        (transitionFeedback.type === 'success' ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-sm dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-200"
          >
            <strong>{transitionFeedback.title}: </strong>
            {transitionFeedback.message}
          </div>
        ) : (
          <ErrorBanner
            title={transitionFeedback.title}
            message={transitionFeedback.message}
            variant={transitionFeedback.type === 'warning' ? 'warning' : 'error'}
            correlationId={transitionFeedback.correlationId}
            onDismiss={() => setTransitionFeedback(null)}
          />
        ))}

      {/* Primary Inquiry Record Card */}
      <article className="rounded-xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-4 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-stone-900 dark:text-zinc-100">
                {inquiry.subject}
              </h1>
              <StatusBadge status={inquiry.status} />
            </div>
            <p className="text-xs font-mono text-stone-400 dark:text-zinc-500">
              ID: {inquiry.id}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl bg-stone-50 p-4 text-sm dark:bg-zinc-800/60 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-400">
              Customer Name
            </p>
            <p className="mt-1 font-semibold text-stone-900 dark:text-zinc-100">
              {inquiry.customerName}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-400">
              Contact Channel
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 font-medium text-stone-800 dark:text-zinc-200">
              <Mail
                className="h-4 w-4 text-teal-600 dark:text-teal-400"
                aria-hidden="true"
              />
              {inquiry.contactInfo}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-400">
              Recorded / Handled By
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 font-medium text-stone-800 dark:text-zinc-200">
              <UserCheck
                className="h-4 w-4 text-teal-600 dark:text-teal-400"
                aria-hidden="true"
              />
              {inquiry.owner.name}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-zinc-200">
            Inquiry Description
          </h2>
          <p className="whitespace-pre-line rounded-lg border border-stone-200/80 bg-white p-4 text-sm leading-relaxed text-stone-700 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300">
            {inquiry.description}
          </p>
        </div>

        {inquiry.resolutionNote && (
          <div className="mt-4 space-y-1.5">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-zinc-200">
              Latest Staff Progress / Resolution Note
            </h2>
            <p className="whitespace-pre-line rounded-lg border border-teal-200 bg-teal-50/50 p-3.5 text-sm text-stone-800 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-200">
              {inquiry.resolutionNote}
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-6 border-t border-stone-100 pt-4 text-xs text-stone-500 dark:border-zinc-800 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
            Recorded: {formatInquiryTimestamp(inquiry.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
            Last Updated: {formatInquiryTimestamp(inquiry.updatedAt)}
          </span>
        </div>
      </article>

      {/* Lifecycle Transition Controls */}
      <StatusTransitionPanel
        inquiry={inquiry}
        isUpdating={isUpdating}
        onTransition={handleStatusTransition}
      />
    </div>
  );
}
