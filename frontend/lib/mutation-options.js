import { notifyError, notifySuccess } from './notify';

/**
 * Standard React Query mutation callbacks with centralized toasts.
 */
export function withMutationNotify(options = {}) {
  const { successMessage, errorMessage, onSuccess, onError, ...rest } = options;

  return {
    ...rest,
    onSuccess: (data, variables, context) => {
      if (successMessage) {
        const msg = typeof successMessage === 'function' ? successMessage(data, variables) : successMessage;
        notifySuccess(msg);
      }
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (errorMessage !== false) {
        const msg =
          typeof errorMessage === 'function'
            ? errorMessage(error, variables)
            : errorMessage || error?.message;
        notifyError(msg);
      }
      onError?.(error, variables, context);
    },
  };
}
