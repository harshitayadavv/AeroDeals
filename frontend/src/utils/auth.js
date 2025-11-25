const API_URL = "http://127.0.0.1:8000";

// Store token in localStorage
export const setAuthToken = (token) => {
  localStorage.setItem("auth_token", token);
};

// Get token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem("auth_token");
};

// Remove token (logout)
export const removeAuthToken = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_info");
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Store user info
export const setUserInfo = (user) => {
  localStorage.setItem("user_info", JSON.stringify(user));
};

// Get user info
export const getUserInfo = () => {
  const userStr = localStorage.getItem("user_info");
  return userStr ? JSON.parse(userStr) : null;
};

// Register user
export const register = async (email, password, fullName) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }

  return await response.json();
};

// Login user
export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login-json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  const data = await response.json();
  setAuthToken(data.access_token);
  return data;
};

// Google OAuth Login - NEW
export const loginWithGoogle = async (googleToken) => {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: googleToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Google login failed");
  }

  const data = await response.json();
  setAuthToken(data.access_token);
  return data;
};

// Get current user info
export const getCurrentUser = async () => {
  const token = getAuthToken();
  if (!token) return null;

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    removeAuthToken();
    return null;
  }

  const user = await response.json();
  setUserInfo(user);
  return user;
};

// Logout
export const logout = () => {
  removeAuthToken();
  window.location.href = "/";
};

// Fetch with authentication
export const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    removeAuthToken();
    window.location.href = "/";
    throw new Error("No authentication token");
  }

  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${token}`,
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setTimeout(() => {
      removeAuthToken();
      window.location.href = "/";
    }, 1000);
  }

  return response;
};