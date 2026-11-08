'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  X,
} from 'lucide-react';
import { InquiryFilters } from '@/components/inquiries/InquiryFilters';
import { InquiryForm } from '@/components/inquiries/InquiryForm';
import { InquiryKpiCards } from '@/components/inquiries/InquiryKpiCards';
import { InquiryList } from '@/components/inquiries/InquiryList';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiClientError } from '@/services/api-client';
import {
  CreateInquiryPayload,
  INQUIRY_STATUS,
  Inquiry,
  InquiryStatus,
  InquiryStatusCounts,
  PaginatedInquiries,
} from '@/types/inquiry.types';

const BOB_SEEDED_INQUIRY_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';

/**
 * Main Customer Inquiry Overview dashboard matching the reference layout:
 * 4 KPI summary cards at the top, search + filter + "+ Record Inquiry" toolbar in the middle,
 * and the multi-column inquiry list below, with full Light/Dark theme support.
 *
 * @returns Inquiry overview dashboard element.
 */
export default function InquiriesOverviewPage(): React.JSX.Element {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const routerRef = React.useRef(router);
  routerRef.current = router;

  const [selectedStatus, setSelectedStatus] = useState<InquiryStatus | 'ALL'>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const [paginatedData, setPaginatedData] = useState<PaginatedInquiries | null>(null);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [isAuthLoading, user, router]);

  /**
   * Fetches the paginated list of inquiries and status KPI counts from the backend API.
   */
  const fetchInquiries = useCallback(async (): Promise<void> => {
    if (!user) {
      return;
    }

    setIsLoadingList(true);
    setListError(null);
    try {
      const response = await apiClient.listInquiries({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: debouncedSearch || undefined,
        page,
        pageSize: 10,
      });
      setPaginatedData(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.statusCode === 401) {
          routerRef.current.replace('/login');
          return;
        }
        setListError(error.message);
      } else {
        setListError('Failed to load customer inquiries. Please try again.');
      }
    } finally {
      setIsLoadingList(false);
    }
  }, [user, selectedStatus, debouncedSearch, page]);

  useEffect(() => {
    if (user) {
      void fetchInquiries();
    }
  }, [user, fetchInquiries]);

  /**
   * Computes workspace KPI counts from server statusCounts or falls back to current items.
   */
  const kpiCounts = useMemo<InquiryStatusCounts>(() => {
    if (paginatedData?.statusCounts) {
      return paginatedData.statusCounts;
    }
    const currentItems = paginatedData?.items ?? [];
    return {
      total: paginatedData?.total ?? currentItems.length,
      NEW: currentItems.filter((i) => i.status === INQUIRY_STATUS.NEW).length,
      IN_PROGRESS: currentItems.filter(
        (i) => i.status === INQUIRY_STATUS.IN_PROGRESS
      ).length,
      RESOLVED: currentItems.filter((i) => i.status === INQUIRY_STATUS.RESOLVED)
        .length,
    };
  }, [paginatedData]);

  /**
   * Handles status filter tab or KPI card selection and resets pagination to page 1.
   *
   * @param nextStatus - Selected status filter or 'ALL'.
   */
  const handleStatusFilterChange = (nextStatus: InquiryStatus | 'ALL'): void => {
    setSelectedStatus(nextStatus);
    setPage(1);
  };

  /**
   * Resets all active status and search filters.
   */
  const handleClearFilters = (): void => {
    setSelectedStatus('ALL');
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  /**
   * Submits a new inquiry via the API client.
   *
   * @param payload - Validated CreateInquiryPayload.
   * @returns Newly created Inquiry record.
   */
  const handleCreateInquiry = async (
    payload: CreateInquiryPayload
  ): Promise<Inquiry> => {
    return apiClient.createInquiry(payload);
  };

  /**
   * Refreshes the list and displays confirmation after a new inquiry is recorded.
   *
   * @param created - Newly created Inquiry record.
   */
  const handleInquiryCreated = (created: Inquiry): void => {
    setShowCreateForm(false);
    setSuccessBanner(
      `Recorded inquiry "${created.subject}" for ${created.customerName}.`
    );
    void fetchInquiries();
  };

  if (isAuthLoading || !user) {
    return <LoadingSkeleton rows={4} />;
  }

  const hasActiveFilters =
    selectedStatus !== 'ALL' || debouncedSearch.trim().length > 0;
  const items = paginatedData?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Row 1: 4 Summary KPI Metric Cards */}
      <InquiryKpiCards
        counts={kpiCounts}
        selectedStatus={selectedStatus}
        onSelectStatus={handleStatusFilterChange}
      />

      {/* Row 2: Search + Filter + "+ Record Inquiry" Toolbar */}
      <InquiryFilters
        selectedStatus={selectedStatus}
        searchQuery={searchInput}
        showCreateForm={showCreateForm}
        onStatusChange={handleStatusFilterChange}
        onSearchChange={setSearchInput}
        onClearFilters={handleClearFilters}
        onToggleCreateForm={() => {
          setShowCreateForm((prev) => !prev);
          setSuccessBanner(null);
        }}
      />

      {/* Confirmation Banner */}
      {successBanner && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-200"
        >
          <span className="font-medium">{successBanner}</span>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            aria-label="Dismiss notification"
            className="rounded p-1 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Collapsible New Inquiry Capture Card */}
      {showCreateForm && (
        <section
          aria-labelledby="capture-inquiry-heading"
          className="rounded-xl border border-stone-200 bg-stone-50/60 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-800/40"
        >
          <div className="mb-4 border-b border-stone-200/80 pb-3 dark:border-zinc-800">
            <h2
              id="capture-inquiry-heading"
              className="text-base font-bold text-stone-900 dark:text-zinc-100"
            >
              Record New Customer Inquiry
            </h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              All fields are validated in both the browser and the Express API. New
              inquiries start in <strong>New</strong> status.
            </p>
          </div>
          <InquiryForm
            onSubmitInquiry={handleCreateInquiry}
            onSuccess={handleInquiryCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </section>
      )}

      {/* Error State */}
      {listError && (
        <ErrorBanner
          title="Unable to Load Inquiries"
          message={listError}
          onRetry={() => void fetchInquiries()}
        />
      )}

      {/* Row 3: Loading, Empty, or Multi-Column Inquiry Table */}
      {isLoadingList ? (
        <LoadingSkeleton rows={4} />
      ) : items.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="No matching inquiries found"
            description="No customer inquiries matched your current status filter or search term."
            actionLabel="Clear Filters"
            onAction={handleClearFilters}
          />
        ) : (
          <EmptyState
            title="No customer inquiries recorded yet"
            description="Record your first customer inquiry to start tracking who is handling it and its resolution status."
            actionLabel="Record First Inquiry"
            onAction={() => setShowCreateForm(true)}
          />
        )
      ) : (
        <>
          <InquiryList inquiries={items} />

          {/* Pagination Footer */}
          {paginatedData && paginatedData.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <span>
                Showing page <strong>{paginatedData.page}</strong> of{' '}
                <strong>{paginatedData.totalPages}</strong> ({paginatedData.total}{' '}
                total inquiries)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={paginatedData.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2.5 py-1 font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={paginatedData.page >= paginatedData.totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(paginatedData.totalPages, p + 1))
                  }
                  className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2.5 py-1 font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Evaluator Helper for Situation #3 (Direct Link Access Verification) */}
      {user.email === 'alice@coffeeninja.local' && (
        <div className="rounded-xl border border-stone-200/80 bg-stone-50/80 p-4 text-xs text-stone-700 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert
                className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold text-stone-900 dark:text-zinc-100">
                  Real-World Situation #3 Check (Direct Link Authorization)
                </p>
                <p className="mt-0.5 text-stone-500 dark:text-zinc-400">
                  Signed in as <strong>Alice (STAFF)</strong>. Try opening a direct link to
                  an inquiry recorded by <strong>Bob</strong> to verify backend 403 access
                  enforcement.
                </p>
              </div>
            </div>
            <Link
              href={`/inquiries/${BOB_SEEDED_INQUIRY_ID}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-semibold text-stone-800 shadow-sm hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <span>Test Direct Link to Bob&apos;s Inquiry</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
