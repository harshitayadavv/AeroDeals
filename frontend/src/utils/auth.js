// Get API URL from environment variable or use default
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

console.log("🔗 API URL:", API_URL); // Debug log

// Store token in localStorage
export const setAuthToken = (token) => {
  localStorage.setItem("auth_token", token);
};

export const getAuthToken = () => {
  return localStorage.getItem("auth_token"); // CORRECT!
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
  try {
    console.log("📝 Registering user:", email);
    
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

    const data = await response.json();
    console.log("✅ Registration successful");
    return data;
  } catch (error) {
    console.error("❌ Registration error:", error);
    throw error;
  }
};

// Login user
export const login = async (email, password) => {
  try {
    console.log("🔐 Logging in:", email);
    
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
    console.log("✅ Login successful");
    return data;
  } catch (error) {
    console.error("❌ Login error:", error);
    throw error;
  }
};

// Google OAuth Login
export const loginWithGoogle = async (googleToken) => {
  try {
    console.log("🔐 Google OAuth login initiated");
    console.log("📍 Calling:", `${API_URL}/auth/google`);
    
    const response = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: googleToken }),
    });

    console.log("📡 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Google login failed:", errorText);
      
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || "Google login failed";
      } catch {
        errorMessage = errorText || "Google login failed";
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("✅ Google login successful");
    
    setAuthToken(data.access_token);
    return data;
  } catch (error) {
    console.error("❌ Google OAuth error:", error);
    throw error;
  }
};

// Get current user info
export const getCurrentUser = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.log("⚠️ No auth token found");
      return null;
    }

    console.log("👤 Fetching current user");

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("❌ Failed to fetch user");
      removeAuthToken();
      return null;
    }

    const user = await response.json();
    setUserInfo(user);
    console.log("✅ User fetched:", user.email);
    console.log("👤 Full user data:", user); // DEBUG: See all user data
    return user;
  } catch (error) {
    console.error("❌ Get current user error:", error);
    removeAuthToken();
    return null;
  }
};

// Logout
export const logout = () => {
  console.log("👋 Logging out");
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