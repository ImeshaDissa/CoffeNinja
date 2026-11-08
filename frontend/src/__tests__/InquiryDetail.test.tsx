import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InquiryDetailView } from '@/components/inquiries/InquiryDetailView';
import { ApiClientError, IApiClient } from '@/services/api-client';
import { ERROR_CODE, INQUIRY_STATUS, Inquiry } from '@/types/inquiry.types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useParams: () => ({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' }),
}));

const BASE_INQUIRY: Inquiry = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  customerName: 'Rohan De Mel',
  contactInfo: '+94 77 458 9210',
  subject: 'Monthly bean subscription delay',
  description: 'Customer has not received Monday shipment.',
  resolutionNote: null,
  status: INQUIRY_STATUS.NEW,
  version: 1,
  ownerId: '11111111-1111-4111-8111-111111111111',
  owner: {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Alice Perera',
    email: 'alice@coffeeninja.local',
  },
  allowedTransitions: [INQUIRY_STATUS.IN_PROGRESS],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Helper to build a partial mock IApiClient for isolated component testing.
 *
 * @param overrides - Specific method mocks.
 * @returns Mocked IApiClient instance.
 */
function createMockApiClient(overrides: Partial<IApiClient>): IApiClient {
  return {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    listInquiries: vi.fn(),
    getInquiryById: vi.fn(),
    createInquiry: vi.fn(),
    updateInquiryStatus: vi.fn(),
    ...overrides,
  };
}

describe('InquiryDetailView Component (Lifecycle, Stale Data & Access Control)', () => {
  it('transitions an inquiry from NEW to IN_PROGRESS with a staff note', async () => {
    const user = userEvent.setup();
    const updatedInquiry: Inquiry = {
      ...BASE_INQUIRY,
      status: INQUIRY_STATUS.IN_PROGRESS,
      version: 2,
      resolutionNote: 'Checked courier hub; arriving at 2 PM.',
      allowedTransitions: [INQUIRY_STATUS.RESOLVED],
    };

    const mockClient = createMockApiClient({
      getInquiryById: vi.fn().mockResolvedValue(BASE_INQUIRY),
      updateInquiryStatus: vi.fn().mockResolvedValue(updatedInquiry),
    });

    render(
      <InquiryDetailView inquiryId={BASE_INQUIRY.id} client={mockClient} />
    );

    expect(
      await screen.findByText('Monthly bean subscription delay')
    ).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-NEW')).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/Progress \/ Resolution Note/i),
      'Checked courier hub; arriving at 2 PM.'
    );
    await user.click(screen.getByRole('button', { name: /Mark as In Progress/i }));

    expect(mockClient.updateInquiryStatus).toHaveBeenCalledWith(BASE_INQUIRY.id, {
      status: INQUIRY_STATUS.IN_PROGRESS,
      expectedVersion: 1,
      resolutionNote: 'Checked courier hub; arriving at 2 PM.',
    });

    expect(
      await screen.findByTestId('status-badge-IN_PROGRESS')
    ).toBeInTheDocument();
    expect(screen.getByText(/Record Version: v2/i)).toBeInTheDocument();
  });

  it('handles stale-data conflict (409 STALE_DATA) by warning the user and refreshing state', async () => {
    const user = userEvent.setup();
    const serverLatestInquiry: Inquiry = {
      ...BASE_INQUIRY,
      status: INQUIRY_STATUS.IN_PROGRESS,
      version: 2,
      resolutionNote: 'Already updated in Tab 1.',
      allowedTransitions: [INQUIRY_STATUS.RESOLVED],
    };

    const staleConflictError = new ApiClientError(
      'This inquiry was updated in another tab or session. Your view has been refreshed with the latest status.',
      409,
      ERROR_CODE.STALE_DATA,
      { latestInquiry: serverLatestInquiry }
    );

    const mockClient = createMockApiClient({
      getInquiryById: vi.fn().mockResolvedValue(BASE_INQUIRY),
      updateInquiryStatus: vi.fn().mockRejectedValue(staleConflictError),
    });

    render(
      <InquiryDetailView inquiryId={BASE_INQUIRY.id} client={mockClient} />
    );

    await screen.findByText('Monthly bean subscription delay');
    await user.click(screen.getByRole('button', { name: /Mark as In Progress/i }));

    expect(
      await screen.findByText(/Stale Data Detected/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-IN_PROGRESS')).toBeInTheDocument();
    expect(screen.getByText(/Record Version: v2/i)).toBeInTheDocument();
    expect(
      screen.getAllByText('Already updated in Tab 1.').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('displays a predictable Access Restricted screen when server returns 403 Forbidden', async () => {
    const forbiddenError = new ApiClientError(
      'Access denied: Staff members may only view and update inquiries they recorded.',
      403,
      ERROR_CODE.FORBIDDEN
    );

    const mockClient = createMockApiClient({
      getInquiryById: vi.fn().mockRejectedValue(forbiddenError),
    });

    render(
      <InquiryDetailView
        inquiryId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1"
        client={mockClient}
      />
    );

    expect(
      await screen.findByText(/Access Restricted \(403 Forbidden\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Staff members may only view and update inquiries they recorded/i)
    ).toBeInTheDocument();
  });
});
