import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { WorkspaceShell } from '@/components/ui/WorkspaceShell';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata: Metadata = {
  title: 'Coffee Ninja | Customer Inquiry Management System',
  description:
    'Staff workspace for capturing, tracking, and resolving customer inquiries.',
};

export interface RootLayoutProps {
  readonly children: React.ReactNode;
}

/**
 * Root Next.js App Router layout providing global ThemeProvider, AuthProvider,
 * and route-aware WorkspaceShell.
 *
 * @param props - Child route tree.
 * @returns HTML document shell.
 */
export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <WorkspaceShell>{children}</WorkspaceShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
