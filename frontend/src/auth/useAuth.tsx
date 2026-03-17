import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Read synchronously so username is never blank on first render
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('shinigami_token'));
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('shinigami_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('shinigami_token', newToken);
    localStorage.setItem('shinigami_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('shinigami_token');
    localStorage.removeItem('shinigami_user');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!token,
      username: user?.username ?? null,
      user,
      token,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
