/**
 * Toast notification helper
 *
 * Usage:
 * ```ts
 * import { toast } from '@sambung-chat/ui/toast';
 *
 * // Success toast
 * toast.success('Account created successfully!');
 *
 * // Error toast
 * toast.error('Failed to create account');
 *
 * // Info toast
 * toast.info('Processing your request...');
 *
 * // Loading toast
 * const loadingToast = toast.loading('Creating account...');
 * toast.dismiss(loadingToast);
 * ```
 */

import { toast as sonnerToast } from 'svelte-sonner';

export const toast = {
  success: (message: string, options?: { description?: string }) => {
    return sonnerToast.success(message, {
      description: options?.description,
    });
  },

  error: (message: string, options?: { description?: string }) => {
    return sonnerToast.error(message, {
      description: options?.description,
    });
  },

  info: (message: string, options?: { description?: string }) => {
    return sonnerToast.info(message, {
      description: options?.description,
    });
  },

  warning: (message: string, options?: { description?: string }) => {
    return sonnerToast.warning(message, {
      description: options?.description,
    });
  },

  loading: (message: string, options?: { description?: string }) => {
    return sonnerToast.loading(message, {
      description: options?.description,
    });
  },

  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, options);
  },

  dismiss: sonnerToast.dismiss,
};
