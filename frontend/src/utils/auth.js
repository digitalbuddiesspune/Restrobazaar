// Token management utilities
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return !!getToken();
};

// Get user info from token (basic implementation)
export const getUserInfo = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    // Decode JWT token (basic implementation)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const isAdmin = () => {
  const userInfo = getUserInfo();
  return userInfo?.role === 'admin' || userInfo?.role === 'super_admin' || userInfo?.role === 'city_admin';
};

export const isSuperAdmin = () => {
  const userInfo = getUserInfo();
  return userInfo?.role === 'super_admin';
};

export const isCityAdmin = () => {
  const userInfo = getUserInfo();
  return userInfo?.role === 'city_admin';
};

export const getUserCity = () => {
  const userInfo = getUserInfo();
  return userInfo?.city || null;
};


