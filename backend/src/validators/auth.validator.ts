import { z } from 'zod';

/**
 * Strict Zod schema for staff sign-in request payloads.
 * Rejects unknown fields to prevent mass-assignment attacks.
 */
export const loginBodySchema = z
  .object({
    email: z
      .string({ required_error: 'Email address is required.' })
      .trim()
      .min(1, 'Email address is required.')
      .max(255, 'Email address cannot exceed 255 characters.')
      .email('Please provide a valid email address.'),
    password: z
      .string({ required_error: 'Password is required.' })
      .min(1, 'Password is required.')
      .max(128, 'Password cannot exceed 128 characters.'),
  })
  .strict();

export type LoginBodyDto = z.infer<typeof loginBodySchema>;

