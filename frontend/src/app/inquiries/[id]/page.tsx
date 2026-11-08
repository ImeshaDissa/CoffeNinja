'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InquiryDetailView } from '@/components/inquiries/InquiryDetailView';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useAuth } from '@/context/AuthContext';

/**
 * Next.js dynamic route page for /inquiries/[id].
 *
 * @returns Authenticated InquiryDetailView element.
 */
export default function InquiryDetailPage(): React.JSX.Element {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [isAuthLoading, user, router]);

  if (isAuthLoading || !user) {
    return <LoadingSkeleton rows={3} />;
  }

  return <InquiryDetailView inquiryId={params.id} />;
}
