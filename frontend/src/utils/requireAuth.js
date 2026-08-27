import { isAuthenticated } from './auth';

/** Opens the global Sign In modal (wired in App.jsx). */
export const openLoginPopup = () => {
  if (typeof window !== 'undefined' && typeof window.openSignInModal === 'function') {
    window.openSignInModal();
    return true;
  }
  return false;
};

/**
 * Returns true if logged in. Otherwise opens the login popup first and returns false.
 */
export const requireAuth = () => {
  if (isAuthenticated()) return true;
  openLoginPopup();
  return false;
};
