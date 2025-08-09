import { useState, useEffect } from 'react';
import { AuthUser } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For development, use mock user
    // In production, this would fetch from your auth provider
    const mockUser: AuthUser = {
      id: '1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Smith',
      profileImageUrl: '',
      role: 'project_manager',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setUser(mockUser);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login for development
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: AuthUser = {
        id: '1',
        email: email,
        firstName: 'John',
        lastName: 'Smith',
        profileImageUrl: '',
        role: 'project_manager',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setUser(mockUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
  };

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}