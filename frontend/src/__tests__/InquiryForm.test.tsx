import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InquiryForm } from '@/components/inquiries/InquiryForm';
import { ApiClientError } from '@/services/api-client';
import { ERROR_CODE, INQUIRY_STATUS, Inquiry } from '@/types/inquiry.types';

const SAMPLE_CREATED_INQUIRY: Inquiry = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  customerName: 'Kavindi Jayasinghe',
  contactInfo: 'kavindi@example.com',
  subject: 'Espresso machine calibration',
  description: 'Need calibration for two commercial machines before Friday.',
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

describe('InquiryForm Component (Capture & Validation States)', () => {
  it('guides the staff member with inline field errors when required info is missing or invalid', async () => {
    const user = userEvent.setup();
    const onSubmitInquiry = vi.fn();
    const onSuccess = vi.fn();

    render(
      <InquiryForm onSubmitInquiry={onSubmitInquiry} onSuccess={onSuccess} />
    );

    await user.type(screen.getByLabelText(/Contact/i), 'invalid-contact');
    await user.click(screen.getByRole('button', { name: /Record Inquiry/i }));

    expect(
      screen.getByText(/Please enter the customer name/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Enter a valid email.*or phone number/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Subject must be at least 3 characters/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Please provide a short description/i)
    ).toBeInTheDocument();
    expect(onSubmitInquiry).not.toHaveBeenCalled();
  });

  it('submits valid customer inquiry details and triggers onSuccess', async () => {
    const user = userEvent.setup();
    const onSubmitInquiry = vi.fn().mockResolvedValue(SAMPLE_CREATED_INQUIRY);
    const onSuccess = vi.fn();

    render(
      <InquiryForm onSubmitInquiry={onSubmitInquiry} onSuccess={onSuccess} />
    );

    await user.type(screen.getByLabelText(/Customer Name/i), 'Kavindi Jayasinghe');
    await user.type(screen.getByLabelText(/Contact/i), 'kavindi@example.com');
    await user.type(
      screen.getByLabelText(/Inquiry Subject/i),
      'Espresso machine calibration'
    );
    await user.type(
      screen.getByLabelText(/Short Description/i),
      'Need calibration for two commercial machines before Friday.'
    );

    await user.click(screen.getByRole('button', { name: /Record Inquiry/i }));

    expect(onSubmitInquiry).toHaveBeenCalledWith({
      customerName: 'Kavindi Jayasinghe',
      contactInfo: 'kavindi@example.com',
      subject: 'Espresso machine calibration',
      description: 'Need calibration for two commercial machines before Friday.',
    });
    expect(onSuccess).toHaveBeenCalledWith(SAMPLE_CREATED_INQUIRY);
  });

  it('displays duplicate warning banner with link to existing inquiry on 409 DUPLICATE_INQUIRY', async () => {
    const user = userEvent.setup();
    const duplicateError = new ApiClientError(
      'An unresolved inquiry with the same customer contact and subject already exists.',
      409,
      ERROR_CODE.DUPLICATE_INQUIRY,
      { existingInquiryId: 'existing-uuid-1234' }
    );
    const onSubmitInquiry = vi.fn().mockRejectedValue(duplicateError);
    const onSuccess = vi.fn();

    render(
      <InquiryForm onSubmitInquiry={onSubmitInquiry} onSuccess={onSuccess} />
    );

    await user.type(screen.getByLabelText(/Customer Name/i), 'Kavindi Jayasinghe');
    await user.type(screen.getByLabelText(/Contact/i), 'kavindi@example.com');
    await user.type(
      screen.getByLabelText(/Inquiry Subject/i),
      'Espresso machine calibration'
    );
    await user.type(
      screen.getByLabelText(/Short Description/i),
      'Need calibration for two commercial machines before Friday.'
    );

    await user.click(screen.getByRole('button', { name: /Record Inquiry/i }));

    expect(
      await screen.findByText(/Duplicate Active Inquiry Detected/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Open Existing Inquiry/i })
    ).toHaveAttribute('href', '/inquiries/existing-uuid-1234');
  });
});

