
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded password for the prototype
const PROTOTYPE_PASSWORD = 'bandsync';
const SESSION_STORAGE_KEY = 'bandsync_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check session storage on initial load
    try {
      const storedAuth = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Could not access session storage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (password: string): boolean => {
    if (password === PROTOTYPE_PASSWORD) {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      } catch (error) {
         console.error("Could not access session storage:", error);
      }
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
     try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
     } catch (error) {
        console.error("Could not access session storage:", error);
     }
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
