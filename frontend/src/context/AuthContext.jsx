
import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

function getStoredAuth() {
  try {
    const storedAuth = localStorage.getItem("medicare_auth");
    return storedAuth ? JSON.parse(storedAuth) : null;
  } catch {
    localStorage.removeItem("medicare_auth");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getStoredAuth);

  const saveAuth = (data) => {
    const authData = {
      token: data.token,
      tokenType: data.tokenType,
      user: {
        userId: data.userId,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
      },
    };

    localStorage.setItem("medicare_auth", JSON.stringify(authData));
    setAuth(authData);
  };

  // UPDATE USER DETAILS
  const updateUser = (updatedUser) => {
    setAuth((currentAuth) => {
      if (!currentAuth) return currentAuth;

      const updatedAuth = {
        ...currentAuth,
        user: {
          ...currentAuth.user,
          ...updatedUser,
        },
      };

      localStorage.setItem(
        "medicare_auth",
        JSON.stringify(updatedAuth)
      );

      return updatedAuth;
    });
  };

  // LOGIN
  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);

    saveAuth(response.data);

    return response.data;
  };

  // PATIENT REGISTRATION
  const register = async (userData) => {
    const response = await api.post("/auth/register", {
      fullName: userData.fullName,
      email: userData.email,
      password: userData.password,
    });

    saveAuth(response.data);

    return response.data;
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("medicare_auth");
    setAuth(null);
  };

  const value = {
    user: auth?.user || null,
    token: auth?.token || null,
    isAuthenticated: Boolean(auth?.token),
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// CUSTOM HOOK
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
