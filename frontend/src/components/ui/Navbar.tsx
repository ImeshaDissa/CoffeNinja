'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Moon, ShieldCheck, Sun } from 'lucide-react';
import { CoffeeNinjaLogoMark } from '@/components/ui/TopBrandBar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { USER_ROLE } from '@/types/inquiry.types';

/**
 * Generates two-letter initials from a staff member's full name.
 *
 * @param name - Full display name.
 * @returns Uppercase initials (e.g. "NF").
 */
function getInitials(name: string): string {
  const parts = name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return 'CN';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * Unified full-width top horizontal bar displaying the Coffee Ninja logo mark and
 * stacked "Coffee Ninja / Customer Inquiries" title on the left, and the staff role pill,
 * Light/Dark theme switcher, bell indicator, avatar, and Sign Out button on the right.
 *
 * @returns Full-width top navigation header element.
 */
export function Navbar(): React.JSX.Element {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  /**
   * Signs out the active staff user and redirects to the sign-in screen.
   */
  const handleLogout = async (): Promise<void> => {
    await logout();
    router.push('/login');
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 w-full border-b border-stone-200/90 bg-white/95 px-5 py-3 backdrop-blur transition-colors duration-200 dark:border-zinc-800 dark:bg-zinc-900/95 sm:px-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Coffee Ninja Logo + Stacked Site Identity */}
        <Link
          href={user ? '/inquiries' : '/login'}
          className="inline-flex items-center gap-3 text-left transition hover:opacity-90"
        >
          <CoffeeNinjaLogoMark />
          <div className="flex flex-col justify-center">
            <span className="text-[15px] font-bold leading-tight tracking-tight text-stone-900 dark:text-zinc-100">
              Coffee Ninja
            </span>
            <span className="text-xs font-medium leading-tight text-stone-500 dark:text-zinc-400">
              Customer Inquiries
            </span>
          </div>
        </Link>

        {/* Right: Role Pill, Theme Toggle, Bell, Online Avatar, and Sign Out */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {user && (
            <div className="hidden items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600 dark:border-zinc-800 dark:bg-zinc-800/70 dark:text-zinc-300 md:flex">
              {user.role === USER_ROLE.MANAGER && (
                <ShieldCheck
                  className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400"
                  aria-hidden="true"
                />
              )}
              <span className="font-medium">{user.name}</span>
              <span className="text-stone-400 dark:text-zinc-500">•</span>
              <span className="text-[11px] text-stone-500 dark:text-zinc-400">
                {user.role === USER_ROLE.MANAGER ? 'All Records' : 'Own Records'}
              </span>
            </div>
          )}

          {/* Light / Dark Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
            }
            title={
              theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
            }
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200/80 bg-white text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {user && (
            <>
              {/* Workspace Activity Indicator */}
              <span
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-stone-200/80 bg-white text-stone-400 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 sm:flex"
                title="Backend Auth & Optimistic Concurrency Active"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
              </span>

              {/* Avatar with Online Status Dot */}
              <div
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-stone-800 text-xs font-bold text-white shadow-sm"
                title={`${user.name} (${user.email})`}
              >
                {getInitials(user.name)}
                <span
                  className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900"
                  aria-hidden="true"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
