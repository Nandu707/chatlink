import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { getCurrentUser, login, register, logout, updateUser, createGuestUser } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    profileImage?: string;
    bio?: string;
    interests?: string[];
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  convertGuestToRegular: (userData: {
    username: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsGuest(!!currentUser.isGuest);
    }
    setIsLoading(false);
  }, []);

  // Login function
  const handleLogin = async (email: string, password: string) => {
    try {
      const user = login(email, password);
      if (user) {
        setUser(user);
        setIsGuest(false);
        return { success: true };
      }
      return { success: false, error: 'Invalid email or password' };
    } catch (error) {
      return { success: false, error: 'An error occurred during login' };
    }
  };

  // Guest login function
  const handleGuestLogin = async () => {
    try {
      // Generate a guest username with a random number
      const guestUsername = `Guest_${Math.floor(Math.random() * 10000)}`;
      
      const guestUser = createGuestUser({
        username: guestUsername,
        // No email or password required for guest
        interests: ['Chatting', 'Meeting People'], // Default interests
      });
      
      if (guestUser) {
        setUser(guestUser);
        setIsGuest(true);
        return { success: true };
      }
      
      return { 
        success: false, 
        error: 'Failed to create guest account' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: 'An error occurred during guest login' 
      };
    }
  };

  // Register function
  const handleRegister = async (userData: {
    username: string;
    email: string;
    password: string;
    profileImage?: string;
    bio?: string;
    interests?: string[];
  }) => {
    try {
      const user = register(userData);
      if (user) {
        setUser(user);
        setIsGuest(false);
        return { success: true };
      }
      return { 
        success: false, 
        error: 'Username or email already exists' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: 'An error occurred during registration' 
      };
    }
  };

  // Convert guest to regular user
  const handleConvertGuestToRegular = async (userData: {
    username: string;
    email: string;
    password: string;
  }) => {
    if (!user || !isGuest) {
      return {
        success: false,
        error: 'You must be logged in as a guest to convert to a regular account'
      };
    }

    try {
      // Create a new regular user keeping some data from guest account
      const regularUser = register({
        ...userData,
        profileImage: user.profileImage,
        bio: user.bio,
        interests: user.interests,
      });

      if (regularUser) {
        // Transfer friends, chats, etc. if needed
        // This would involve more complex logic in a real app

        setUser(regularUser);
        setIsGuest(false);
        return { success: true };
      }
      return {
        success: false,
        error: 'Username or email already exists'
      };
    } catch (error) {
      return {
        success: false,
        error: 'An error occurred while converting to a regular account'
      };
    }
  };

  // Logout function
  const handleLogout = async () => {
    logout();
    setUser(null);
    setIsGuest(false);
  };

  // Update profile
  const handleUpdateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = updateUser({
      ...user,
      ...data,
    });
    
    setUser(updatedUser);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isGuest: isGuest,
    isLoading,
    login: handleLogin,
    loginAsGuest: handleGuestLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    convertGuestToRegular: handleConvertGuestToRegular,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};