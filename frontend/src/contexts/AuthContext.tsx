import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';

interface User {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
      setError(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
      setError('Authentication failed');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setIsAuthenticated(true);
      setError(null);
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const loginWithGoogle = async (token: string) => {
    try {
      const response = await axios.post('/api/auth/google', { credential: token });
      const { token: jwtToken, user } = response.data;
      localStorage.setItem('token', jwtToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      setUser(user);
      setIsAuthenticated(true);
      setError(null);
    } catch (error: any) {
      console.error('Google login failed:', error);
      setError(error.response?.data?.error || 'Google login failed');
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await axios.post('/api/auth/register', { email, password, name });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setIsAuthenticated(true);
      setError(null);
    } catch (error: any) {
      console.error('Registration failed:', error);
      setError(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, error, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 