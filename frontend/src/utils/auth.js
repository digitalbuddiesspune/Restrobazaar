// User info management (stored in localStorage, NOT the token)
// We only store user info (id, name, role) for UI purposes
// The actual JWT is stored in HTTP-only cookie and managed by the browser
export const setUserInfo = (userInfo) => {
  try {
    if (userInfo) {
      localStorage.setItem('userInfo', JSON.stringify({
        id: userInfo.id || userInfo._id,
        name: userInfo.name,
        email: userInfo.email,
        role: userInfo.role || 'user',
      }));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('authChange'));
    } else {
      localStorage.removeItem('userInfo');
      window.dispatchEvent(new Event('authChange'));
    }
  } catch (error) {
    console.error('Error setting user info:', error);
  }
};

export const getUserInfo = () => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch {
    return null;
  }
};

export const removeUserInfo = () => {
  try {
    localStorage.removeItem('userInfo');
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authChange'));
  } catch {
    // Ignore errors
  }
};

// Authentication check
// Note: This checks if user info exists in localStorage
// For a more robust check, verify with the backend API
export const isAuthenticated = () => {
  try {
    const userInfo = getUserInfo();
    return userInfo !== null && userInfo.id !== undefined;
  } catch {
    return false;
  }
};

// Check if user is admin
export const isAdmin = () => {
  try {
    const userInfo = getUserInfo();
    if (!userInfo) return false;
    
    return ['admin', 'super_admin', 'city_admin'].includes(userInfo.role);
  } catch {
    return false;
  }
};

// Logout function - clears user info and calls logout API
export const logout = async () => {
  try {
    // Import authAPI dynamically to avoid circular dependencies
    const { authAPI } = await import('./api');
    await authAPI.logout();
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Always clear local user info
    removeUserInfo();
    window.location.href = '/';
  }
};

