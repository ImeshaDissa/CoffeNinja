import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InquiryKpiCards } from '@/components/inquiries/InquiryKpiCards';
import { InquiryList } from '@/components/inquiries/InquiryList';
import { Navbar } from '@/components/ui/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { IApiClient } from '@/services/api-client';
import { INQUIRY_STATUS, USER_ROLE } from '@/types/inquiry.types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('Dashboard KPI Cards & Light/Dark Theme Toggle', () => {
  it('renders the 4 inquiry KPI summary cards and triggers status filter on click', async () => {
    const user = userEvent.setup();
    const onSelectStatus = vi.fn();

    render(
      <InquiryKpiCards
        counts={{ total: 5, NEW: 2, IN_PROGRESS: 2, RESOLVED: 1 }}
        selectedStatus="ALL"
        onSelectStatus={onSelectStatus}
      />
    );

    expect(screen.getByText('Total Inquiries')).toBeInTheDocument();
    expect(screen.getByText('New Inquiries')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
    expect(screen.getByText('20% Resolution rate')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /In Progress/i }));
    expect(onSelectStatus).toHaveBeenCalledWith(INQUIRY_STATUS.IN_PROGRESS);
  });

  it('toggles dark class on documentElement when clicking the theme switcher in Navbar', async () => {
    const user = userEvent.setup();
    const mockClient: IApiClient = {
      login: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        email: 'alice@coffeeninja.local',
        name: 'Alice Perera',
        role: USER_ROLE.STAFF,
      }),
      listInquiries: vi.fn(),
      getInquiryById: vi.fn(),
      createInquiry: vi.fn(),
      updateInquiryStatus: vi.fn(),
    };

    document.documentElement.classList.remove('dark');
    window.localStorage.removeItem('cn_workspace_theme');

    render(
      <ThemeProvider>
        <AuthProvider client={mockClient}>
          <Navbar />
        </AuthProvider>
      </ThemeProvider>
    );

    expect(screen.getByText('Coffee Ninja')).toBeInTheDocument();
    expect(screen.getByText('Customer Inquiries')).toBeInTheDocument();

    const toggleButton = await screen.findByRole('button', {
      name: /Switch to dark theme/i,
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.click(toggleButton);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(
      screen.getByRole('button', { name: /Switch to light theme/i })
    ).toBeInTheDocument();
  });

  it('places the Status badge in the final column of each InquiryList row without an on/off toggle', () => {
    render(
      <InquiryList
        inquiries={[
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
            customerName: 'Kavindi Jayasinghe',
            contactInfo: 'kavindi.j@example.com',
            subject: 'Commercial espresso machine calibration request',
            description: 'Customer requested an on-site pressure check.',
            status: INQUIRY_STATUS.RESOLVED,
            resolutionNote: 'Technician calibrated group head.',
            version: 2,
            allowedTransitions: [INQUIRY_STATUS.IN_PROGRESS],
            ownerId: '11111111-1111-4111-8111-111111111111',
            owner: {
              id: '11111111-1111-4111-8111-111111111111',
              name: 'Alice Perera',
              email: 'alice@coffeeninja.local',
            },
            createdAt: '2026-11-08T04:00:00.000Z',
            updatedAt: '2026-11-08T04:30:00.000Z',
          },
        ]}
      />
    );

    const rowLink = screen.getByRole('link', {
      name: /Commercial espresso machine calibration request/i,
    });
    expect(rowLink.lastElementChild).toHaveTextContent('Status');
    expect(rowLink.lastElementChild).toHaveTextContent('Resolved');
    expect(
      screen.queryByTitle('Open inquiry lifecycle controls')
    ).not.toBeInTheDocument();
  });
});

