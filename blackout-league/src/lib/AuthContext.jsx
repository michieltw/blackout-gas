import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    // Mock successful auth
    setTimeout(() => {
        setIsAuthenticated(true);
        setAuthChecked(true);
        setIsLoadingAuth(false);
        setAuthError(null);
    }, 500);
  }, []);

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authChecked,
      authError,
      checkUserAuth,
      navigateToLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
