import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export type Role = "ADMIN" | "FACULTY" | "STUDENT";

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    role: Role;
    registerNumber: string;
  } | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (user: AuthState["user"], token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  // Check auth on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("authToken");
        const role = localStorage.getItem("userRole");
        const userId = localStorage.getItem("userId");
        const userName = localStorage.getItem("userName");
        const registerNumber = localStorage.getItem("registerNumber");

        if (token && role && userId && userName && registerNumber) {
          const normalizedRole = normalizeRole(role);
          if (normalizedRole) {
            setAuthState({
              isAuthenticated: true,
              user: {
                id: userId,
                name: userName,
                role: normalizedRole,
                registerNumber,
              },
              isLoading: false,
            });
            return;
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }

      // Not authenticated
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    };

    checkAuth();
  }, []);

  const login = (user: AuthState["user"], token: string) => {
    if (!user || !token) return;

    localStorage.setItem("authToken", token);
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("userId", user.id);
    localStorage.setItem("userName", user.name);
    localStorage.setItem("registerNumber", user.registerNumber);

    setAuthState({
      isAuthenticated: true,
      user,
      isLoading: false,
    });

    // Redirect to appropriate dashboard
    const roleHome = user.role === "ADMIN" ? "/admin/dashboard" :
                     user.role === "FACULTY" ? "/teacher/dashboard" :
                     "/student/dashboard";
    navigate(roleHome, { replace: true });
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("registerNumber");

    // Update state
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    // Redirect to login
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

function normalizeRole(value: string): Role | null {
  const upper = value.toUpperCase();
  if (upper === "ADMIN" || upper === "FACULTY" || upper === "STUDENT") {
    return upper as Role;
  }
  return null;
}