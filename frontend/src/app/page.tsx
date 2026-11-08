'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useAuth } from '@/context/AuthContext';

/**
 * Root landing route that directs signed-in staff to /inquiries and unauthenticated visitors to /login.
 *
 * @returns Loading placeholder during redirect.
 */
export default function HomePage(): React.JSX.Element {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? '/inquiries' : '/login');
    }
  }, [user, isLoading, router]);

  return <LoadingSkeleton rows={3} />;
}

