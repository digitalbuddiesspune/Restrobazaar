import { Toaster } from 'react-hot-toast';

/**
 * NotificationProvider Component
 * 
 * Wraps the app and provides toast notifications throughout the application.
 * Uses react-hot-toast with sensible default options.
 * 
 * Default options:
 * - Position: top-right
 * - Duration: 3000ms (3 seconds)
 * - Styling: Custom styles matching the app theme
 */
const NotificationProvider = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          // Default duration for all toasts
          duration: 3000,
          
          // Success toast styling
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          
          // Error toast styling
          error: {
            duration: 4000, // Errors stay longer
            style: {
              background: '#ef4444',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
          
          // Info toast styling
          style: {
            background: '#3b82f6',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          
          // Loading toast styling
          loading: {
            style: {
              background: '#6366f1',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#6366f1',
            },
          },
        }}
        // Container styling
        containerStyle={{
          top: 20,
          right: 20,
        }}
        // Reverse order (newest on top)
        reverseOrder={false}
      />
    </>
  );
};

export default NotificationProvider;
