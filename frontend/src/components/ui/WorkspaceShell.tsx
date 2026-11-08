'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';

export interface WorkspaceShellProps {
  readonly children: React.ReactNode;
}

/**
 * Renders the unified top horizontal bar (Logo + "Coffee Ninja / Customer Inquiries" on left,
 * user controls & theme toggle on right) across the site, followed by:
 * - On `/login`: Centered split-card Sign-In showcase layout over soft organic accents.
 * - On `/inquiries*`: Full-width (`w-full`, non-centered) elevated dashboard workspace.
 *
 * @param props - Child route elements.
 * @returns Route-appropriate layout shell.
 */
export function WorkspaceShell({
  children,
}: WorkspaceShellProps): React.JSX.Element {
  const pathname = usePathname();
  const isLoginRoute = pathname === '/login';

  if (isLoginRoute) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f4f9f8] transition-colors duration-200 dark:bg-zinc-950">
        <Navbar />
        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-8 sm:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-[#e3f4ef] opacity-80 dark:bg-teal-950/30"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-[#e3f4ef] opacity-70 dark:bg-teal-950/20"
          />
          <main className="relative z-10 w-full max-w-6xl">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#eaedec] transition-colors duration-200 dark:bg-zinc-950">
      <Navbar />
      <div className="w-full flex-1 px-3 py-4 sm:px-5 sm:py-5">
        <div className="w-full overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition-colors duration-200 dark:border-zinc-800 dark:bg-zinc-900">
          <main className="w-full p-5 sm:px-8 sm:py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
