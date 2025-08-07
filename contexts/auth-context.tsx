'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  company: string;
  isActive: boolean;
  quotaLimit: number;
  quotaUsed: number;
  createdAt: string;
  lastLogin: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, company: string) => Promise<boolean>;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@callsense.com',
    role: 'super_admin',
    company: 'CallSense Inc.',
    isActive: true,
    quotaLimit: 10000,
    quotaUsed: 245,
    createdAt: '2024-01-15T00:00:00Z',
    lastLogin: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    email: 'manager@company.com',
    role: 'admin',
    company: 'Tech Corp',
    isActive: true,
    quotaLimit: 1000,
    quotaUsed: 67,
    createdAt: '2024-01-16T00:00:00Z',
    lastLogin: '2024-01-20T09:15:00Z'
  },
  {
    id: '3',
    email: 'user@company.com',
    role: 'user',
    company: 'Tech Corp',
    isActive: true,
    quotaLimit: 100,
    quotaUsed: 23,
    createdAt: '2024-01-17T00:00:00Z',
    lastLogin: '2024-01-20T11:45:00Z'
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem('auth_token');
    if (token) {
      // In a real app, validate the token with the backend
      const savedUser = localStorage.getItem('current_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Mock authentication - in real app, this would call your backend
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && password === 'password') {
      setUser(foundUser);
      localStorage.setItem('auth_token', 'mock_jwt_token');
      localStorage.setItem('current_user', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  };

  const register = async (email: string, password: string, company: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Mock registration
    const newUser: User = {
      id: Date.now().toString(),
      email,
      role: 'user',
      company,
      isActive: true,
      quotaLimit: 100,
      quotaUsed: 0,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    mockUsers.push(newUser);
    setUser(newUser);
    localStorage.setItem('auth_token', 'mock_jwt_token');
    localStorage.setItem('current_user', JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    const permissions = {
      'view_own_data': ['user', 'admin', 'super_admin'],
      'view_all_data': ['admin', 'super_admin'],
      'manage_users': ['super_admin'],
      'system_config': ['super_admin'],
      'upload_files': ['user', 'admin', 'super_admin'],
      'delete_files': ['user', 'admin', 'super_admin'],
      'view_analytics': ['user', 'admin', 'super_admin'],
      'export_data': ['admin', 'super_admin']
    };
    
    return permissions[permission]?.includes(user.role) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading, hasPermission }}>
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