import toast from 'react-hot-toast';

/**
 * Notification Utility Functions
 * 
 * Provides easy-to-use functions for displaying toast notifications
 * throughout the application.
 */

/**
 * Display a success notification
 * @param {string} message - The success message to display
 * @param {object} options - Additional toast options (duration, etc.)
 * @returns {string} Toast ID
 */
export const notifySuccess = (message, options = {}) => {
  return toast.success(message, {
    duration: 3000,
    ...options,
  });
};

/**
 * Display an error notification
 * @param {string} message - The error message to display
 * @param {object} options - Additional toast options (duration, etc.)
 * @returns {string} Toast ID
 */
export const notifyError = (message, options = {}) => {
  return toast.error(message, {
    duration: 4000, // Errors stay longer by default
    ...options,
  });
};

/**
 * Display an info notification
 * @param {string} message - The info message to display
 * @param {object} options - Additional toast options (duration, etc.)
 * @returns {string} Toast ID
 */
export const notifyInfo = (message, options = {}) => {
  return toast(message, {
    duration: 3000,
    icon: 'ℹ️',
    ...options,
  });
};

/**
 * Display a loading notification
 * @param {string} message - The loading message to display
 * @param {object} options - Additional toast options
 * @returns {string} Toast ID (use this to dismiss the loading toast)
 */
export const notifyLoading = (message, options = {}) => {
  return toast.loading(message, {
    duration: Infinity, // Loading toasts don't auto-dismiss
    ...options,
  });
};

/**
 * Display a promise-based notification
 * Automatically shows loading, then success/error based on promise result
 * 
 * @param {Promise} promise - The promise to track
 * @param {object} messages - Object with loading, success, and error messages
 * @param {string} messages.loading - Message shown while promise is pending
 * @param {string|function} messages.success - Message shown on success (can be a function that receives the result)
 * @param {string|function} messages.error - Message shown on error (can be a function that receives the error)
 * @returns {Promise} The original promise
 * 
 * @example
 * notifyPromise(
 *   api.createOrder(data),
 *   {
 *     loading: 'Creating order...',
 *     success: 'Order created successfully!',
 *     error: 'Failed to create order'
 *   }
 * );
 * 
 * @example With dynamic messages
 * notifyPromise(
 *   api.updateProduct(id, data),
 *   {
 *     loading: 'Updating product...',
 *     success: (data) => `Product "${data.name}" updated successfully!`,
 *     error: (err) => err.response?.data?.message || 'Update failed'
 *   }
 * );
 */
export const notifyPromise = (promise, messages) => {
  const { loading, success, error } = messages;

  return toast.promise(
    promise,
    {
      loading: loading || 'Processing...',
      success: (data) => {
        if (typeof success === 'function') {
          return success(data);
        }
        return success || 'Operation completed successfully!';
      },
      error: (err) => {
        if (typeof error === 'function') {
          return error(err);
        }
        // Try to extract error message from API response
        const errorMessage = err?.response?.data?.message || err?.message || error || 'Operation failed';
        return errorMessage;
      },
    },
    {
      duration: 3000,
    }
  );
};

/**
 * Dismiss a specific toast
 * @param {string} toastId - The toast ID to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Export toast directly for advanced usage
export { toast };
