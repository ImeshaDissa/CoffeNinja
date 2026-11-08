'use client';

import React, { useState } from 'react';
import { Loader2, PlusCircle } from 'lucide-react';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { ApiClientError } from '@/services/api-client';
import {
  CreateInquiryPayload,
  ERROR_CODE,
  Inquiry,
} from '@/types/inquiry.types';

export interface InquiryFormProps {
  readonly onSubmitInquiry: (payload: CreateInquiryPayload) => Promise<Inquiry>;
  readonly onSuccess: (created: Inquiry) => void;
  readonly onCancel?: () => void;
}

interface FieldErrors {
  customerName?: string;
  contactInfo?: string;
  subject?: string;
  description?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[+]?[0-9\s\-().]{7,25}$/;

/**
 * Checks whether a contact info string is formatted as a valid email or phone number.
 *
 * @param rawValue - Customer contact input string.
 * @returns True if valid email or phone with 7-15 digits; false otherwise.
 */
export function validateContactFormat(rawValue: string): boolean {
  const value = rawValue.trim();
  if (EMAIL_PATTERN.test(value)) {
    return true;
  }
  if (!PHONE_PATTERN.test(value)) {
    return false;
  }
  const digits = value.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 15;
}

/**
 * Validates customer inquiry form values on the client before sending to the API.
 * Note: The backend API independently validates all inputs using strict Zod schemas.
 *
 * @param values - Form field values.
 * @returns Map of field validation error messages.
 */
export function validateInquiryForm(values: CreateInquiryPayload): FieldErrors {
  const errors: FieldErrors = {};

  if (values.customerName.trim().length < 2) {
    errors.customerName = 'Please enter the customer name (at least 2 characters).';
  } else if (values.customerName.trim().length > 120) {
    errors.customerName = 'Customer name cannot exceed 120 characters.';
  }

  if (values.contactInfo.trim().length === 0) {
    errors.contactInfo =
      'Please provide an email address or phone number to reach the customer.';
  } else if (!validateContactFormat(values.contactInfo)) {
    errors.contactInfo =
      'Enter a valid email (e.g. customer@domain.com) or phone number (at least 7 digits).';
  }

  if (values.subject.trim().length < 3) {
    errors.subject = 'Subject must be at least 3 characters.';
  } else if (values.subject.trim().length > 200) {
    errors.subject = 'Subject cannot exceed 200 characters.';
  }

  if (values.description.trim().length < 10) {
    errors.description =
      'Please provide a short description (at least 10 characters) so staff have context.';
  } else if (values.description.trim().length > 2000) {
    errors.description = 'Description cannot exceed 2000 characters.';
  }

  return errors;
}

/**
 * Form component enabling a signed-in staff member to capture a new customer inquiry.
 * Guides staff on invalid/missing fields and surfaces duplicate submission warnings cleanly.
 *
 * @param props - Submission handler, success callback, and optional cancel callback.
 * @returns Controlled InquiryForm element.
 */
export function InquiryForm({
  onSubmitInquiry,
  onSuccess,
  onCancel,
}: InquiryFormProps): React.JSX.Element {
  const [customerName, setCustomerName] = useState<string>('');
  const [contactInfo, setContactInfo] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<{
    title: string;
    message: string;
    duplicateId?: string;
    correlationId?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /**
   * Clears the inline validation message for a specific field as the user edits it.
   *
   * @param field - Field key being edited.
   */
  const clearFieldError = (field: keyof FieldErrors): void => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Validates inputs and submits the new customer inquiry to the backend API.
   *
   * @param event - Form submission event.
   */
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    setSubmitError(null);

    const payload: CreateInquiryPayload = {
      customerName,
      contactInfo,
      subject,
      description,
    };

    const validationIssues = validateInquiryForm(payload);
    if (Object.keys(validationIssues).length > 0) {
      setFieldErrors(validationIssues);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await onSubmitInquiry(payload);
      setCustomerName('');
      setContactInfo('');
      setSubject('');
      setDescription('');
      setFieldErrors({});
      onSuccess(created);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === ERROR_CODE.VALIDATION_ERROR && error.details?.fields) {
          const serverFieldErrors: FieldErrors = {};
          for (const issue of error.details.fields) {
            if (
              issue.field === 'customerName' ||
              issue.field === 'contactInfo' ||
              issue.field === 'subject' ||
              issue.field === 'description'
            ) {
              serverFieldErrors[issue.field] = issue.message;
            }
          }
          setFieldErrors(serverFieldErrors);
        }

        if (error.code === ERROR_CODE.DUPLICATE_INQUIRY) {
          setSubmitError({
            title: 'Duplicate Active Inquiry Detected',
            message: error.message,
            duplicateId: error.details?.existingInquiryId,
            correlationId: error.correlationId,
          });
          return;
        }

        setSubmitError({
          title: 'Could Not Save Inquiry',
          message: error.message,
          correlationId: error.correlationId,
        });
        return;
      }

      setSubmitError({
        title: 'Unexpected Error',
        message:
          'Failed to save inquiry. Your input has been preserved so you can try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
      {submitError && (
        <ErrorBanner
          title={submitError.title}
          message={submitError.message}
          variant={submitError.duplicateId ? 'warning' : 'error'}
          correlationId={submitError.correlationId}
          actionLink={
            submitError.duplicateId
              ? {
                  href: `/inquiries/${submitError.duplicateId}`,
                  label: 'Open Existing Inquiry',
                }
              : undefined
          }
          onDismiss={() => setSubmitError(null)}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="customerName"
            className="block text-sm font-semibold text-stone-800 dark:text-zinc-200"
          >
            Customer Name <span className="text-red-500">*</span>
          </label>
          <input
            id="customerName"
            name="customerName"
            type="text"
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              clearFieldError('customerName');
            }}
            placeholder="e.g. Kavindi Jayasinghe"
            aria-invalid={Boolean(fieldErrors.customerName)}
            className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:outline-none focus:ring-1 dark:bg-zinc-900 dark:text-zinc-100 ${
              fieldErrors.customerName
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : 'border-stone-300 focus:border-teal-600 focus:ring-teal-600 dark:border-zinc-700'
            }`}
          />
          {fieldErrors.customerName && (
            <p
              role="alert"
              className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
            >
              {fieldErrors.customerName}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contactInfo"
            className="block text-sm font-semibold text-stone-800 dark:text-zinc-200"
          >
            Contact (Email or Phone) <span className="text-red-500">*</span>
          </label>
          <input
            id="contactInfo"
            name="contactInfo"
            type="text"
            value={contactInfo}
            onChange={(e) => {
              setContactInfo(e.target.value);
              clearFieldError('contactInfo');
            }}
            placeholder="e.g. customer@domain.com or +94 77 123 4567"
            aria-invalid={Boolean(fieldErrors.contactInfo)}
            className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:outline-none focus:ring-1 dark:bg-zinc-900 dark:text-zinc-100 ${
              fieldErrors.contactInfo
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : 'border-stone-300 focus:border-teal-600 focus:ring-teal-600 dark:border-zinc-700'
            }`}
          />
          {fieldErrors.contactInfo && (
            <p
              role="alert"
              className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
            >
              {fieldErrors.contactInfo}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-semibold text-stone-800 dark:text-zinc-200"
        >
          Inquiry Subject <span className="text-red-500">*</span>
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            clearFieldError('subject');
          }}
          placeholder="e.g. Commercial espresso machine calibration request"
          aria-invalid={Boolean(fieldErrors.subject)}
          className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:outline-none focus:ring-1 dark:bg-zinc-900 dark:text-zinc-100 ${
            fieldErrors.subject
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-stone-300 focus:border-teal-600 focus:ring-teal-600 dark:border-zinc-700'
          }`}
        />
        {fieldErrors.subject && (
          <p
            role="alert"
            className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
          >
            {fieldErrors.subject}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-semibold text-stone-800 dark:text-zinc-200"
        >
          Short Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            clearFieldError('description');
          }}
          placeholder="Summarize what the customer needs, any deadlines, and relevant branch/equipment details..."
          aria-invalid={Boolean(fieldErrors.description)}
          className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:outline-none focus:ring-1 dark:bg-zinc-900 dark:text-zinc-100 ${
            fieldErrors.description
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-stone-300 focus:border-teal-600 focus:ring-teal-600 dark:border-zinc-700'
          }`}
        />
        {fieldErrors.description && (
          <p
            role="alert"
            className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
          >
            {fieldErrors.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-stone-200/80 pt-4 dark:border-zinc-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Recording...
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Record Inquiry
            </>
          )}
        </button>
      </div>
    </form>
  );
}
