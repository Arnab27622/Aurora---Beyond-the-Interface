import { z } from 'zod';

/**
 * Email validation schema using Zod
 * Enforces RFC 5322 compliant email format with practical length limits
 */
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()
  .trim();

const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .max(128, 'Password must not exceed 128 characters');

const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(255, 'Name must not exceed 255 characters')
  .trim();

/**
 * Schema for signin requests
 * Validates email and password requirements
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Schema for registration requests
 * Validates name, email, and password requirements
 */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Type definitions for form data
 */
export type SignInInput = z.infer<typeof signInSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
