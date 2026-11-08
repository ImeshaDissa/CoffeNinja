'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, Loader2, ShieldCheck } from 'lucide-react';
import { CoffeeNinjaIllustration } from '@/components/auth/CoffeeNinjaIllustration';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useAuth } from '@/context/AuthContext';
import { ApiClientError } from '@/services/api-client';

interface SeededAccountOption {
  readonly shortLabel: string;
  readonly label: string;
  readonly email: string;
  readonly password: string;
  readonly roleBadge: string;
  readonly roleSummary: string;
}

/**
 * Seeded staff accounts provided for quick testing and evaluation, as permitted by the brief.
 */
const SEEDED_ACCOUNTS: readonly SeededAccountOption[] = [
  {
    shortLabel: 'Alice',
    label: 'Alice Perera',
    email: 'alice@coffeeninja.local',
    password: 'StaffPass123!',
    roleBadge: 'STAFF',
    roleSummary: 'Scoped access: views & manages inquiries recorded by Alice',
  },
  {
    shortLabel: 'Bob',
    label: 'Bob Silva',
    email: 'bob@coffeeninja.local',
    password: 'StaffPass123!',
    roleBadge: 'STAFF',
    roleSummary: 'Scoped access: views & manages inquiries recorded by Bob',
  },
  {
    shortLabel: 'Manager',
    label: 'Nadia Fernando',
    email: 'manager@coffeeninja.local',
    password: 'ManagerPass123!',
    roleBadge: 'MANAGER',
    roleSummary: 'Supervisor access: views & manages all staff inquiries',
  },
];

/**
 * Split-card Staff Sign-In page modeled after the reference two-column showcase layout
 * and customized for Coffee Ninja with Light and Dark theme support.
 *
 * @returns Split-card Sign-In page element.
 */
export default function LoginPage(): React.JSX.Element {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState<string>(SEEDED_ACCOUNTS[0].email);
  const [password, setPassword] = useState<string>(SEEDED_ACCOUNTS[0].password);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/inquiries');
    }
  }, [user, isLoading, router]);

  const selectedPreset = SEEDED_ACCOUNTS.find(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase()
  );

  /**
   * Populates the sign-in inputs with a selected seeded staff account.
   *
   * @param account - Selected seeded account credentials.
   */
  const handleSelectSeededAccount = (account: SeededAccountOption): void => {
    setEmail(account.email);
    setPassword(account.password);
    setErrorMessage(null);
  };

  /**
   * Submits staff credentials to the backend authentication API.
   *
   * @param event - Form submit event.
   */
  const handleLoginSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your staff email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push('/inquiries');
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to sign in right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-[22px] border-[5px] border-white bg-[#f3faf8] shadow-[0_24px_60px_rgba(15,35,30,0.10)] transition-colors duration-200 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/50">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left Column: Brand Wordmark + Heading + Floating Form Card */}
        <div className="relative flex flex-col items-center justify-center px-6 py-10 sm:px-12 sm:py-12">
          {/* Coffee Ninja Custom Wordmark (Inspired by reference wordmark) */}
          <div className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-stone-800 dark:text-zinc-100">
            <span>C</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#72d6be] text-stone-900 shadow-xs">
              <Coffee className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
            </span>
            <span>ffee Ninja</span>
          </div>

          {/* Centered Two-Line Prompt & Subtitle */}
          <div className="mt-6 text-center">
            <h1 className="text-lg font-bold leading-snug text-stone-800 dark:text-zinc-100 sm:text-xl">
              Please sign in with your staff
              <br />
              credentials:
            </h1>
            <p className="mt-1.5 text-xs font-medium text-stone-500 dark:text-zinc-400">
              Capture, track, and resolve customer inquiries with clarity.
            </p>
          </div>

          {/* Floating Inner White Card (Matches elevated form card in reference) */}
          <div className="mt-6 w-full max-w-[360px] rounded-lg border border-stone-100 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:border-zinc-800 dark:bg-zinc-800/90 dark:shadow-black/30">
            {errorMessage && (
              <div className="mb-4">
                <ErrorBanner
                  title="Sign-In Failed"
                  message={errorMessage}
                  onDismiss={() => setErrorMessage(null)}
                />
              </div>
            )}

            {/* Quick-Fill Seeded Demo Staff Selector */}
            <div className="mb-4">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-400">
                Quick-Fill Demo Staff Account
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {SEEDED_ACCOUNTS.map((account) => {
                  const isActive = email === account.email;
                  return (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => handleSelectSeededAccount(account)}
                      className={`rounded-md border px-2 py-1.5 text-center text-xs font-semibold transition ${
                        isActive
                          ? 'border-[#5bc4ac] bg-[#eefaf7] text-teal-900 dark:border-teal-400 dark:bg-teal-950/60 dark:text-teal-200'
                          : 'border-stone-200 bg-stone-50/70 text-stone-600 hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-700/70'
                      }`}
                    >
                      {account.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={(e) => void handleLoginSubmit(e)}
              noValidate
              className="space-y-3"
            >
              <div>
                <label htmlFor="email" className="sr-only">
                  Staff Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Staff Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:border-[#5bc4ac] focus:outline-none focus:ring-1 focus:ring-[#5bc4ac] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:border-[#5bc4ac] focus:outline-none focus:ring-1 focus:ring-[#5bc4ac] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  required
                />
              </div>

              {/* Contextual Role Badge Row (Matches the prefixed input aesthetic in reference) */}
              <div className="flex overflow-hidden rounded border border-stone-200 bg-stone-50/70 text-[11px] dark:border-zinc-700 dark:bg-zinc-900/60">
                <span className="flex shrink-0 items-center gap-1 border-r border-stone-200 bg-stone-100/90 px-2.5 py-2 font-bold text-stone-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  <ShieldCheck
                    className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400"
                    aria-hidden="true"
                  />
                  {selectedPreset?.roleBadge ?? 'STAFF'}
                </span>
                <span className="truncate px-2.5 py-2 text-stone-500 dark:text-zinc-400">
                  {selectedPreset?.roleSummary ??
                    'Authenticated via httpOnly session cookie'}
                </span>
              </div>

              <div className="pt-1.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded bg-[#72d6be] px-4 py-2.5 text-xs font-bold tracking-wide text-stone-900 shadow-xs transition hover:bg-[#5ec7ae] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Signing In...
                    </>
                  ) : (
                    <span>Sign In to Workspace!</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          <p className="mt-4 text-center text-[11px] text-stone-400 dark:text-zinc-500">
            Enforced by Express API • httpOnly JWT Session • Coffee Ninja (Pvt) Ltd
          </p>
        </div>

        {/* Right Column: Custom Coffee Ninja Flat-Vector Illustration Panel */}
        <CoffeeNinjaIllustration />
      </div>
    </div>
  );
}
