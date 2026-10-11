// AuthContext.jsx — Real JWT Backend Authentication State Provider
//
// Features:
//   - Connected to Node/Express + MongoDB backend endpoints
//   - Manages JWT token in localStorage/sessionStorage
//   - Restores session automatically on app startup via GET /api/auth/me
//   - Exposes register(), login(), logout(), currentUser, isAuthenticated, loading

import { createContext, useState, useEffect } from 'react';
import {
  loginUser,
  registerUser,
  getMe,
  getToken,
  setToken,
  removeToken,
} from '../services/api';

// Helper: Generate 2-character avatar initials from user name
function getAvatar(name) {
  if (!name) return 'DF';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Restore initial user state from localStorage/sessionStorage if available
  const [user, setUser] = useState(() => {
    try {
      const savedLocal = localStorage.getItem('drivefleet_user');
      const savedSession = sessionStorage.getItem('drivefleet_user');
      const saved = savedLocal || savedSession;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [tokenState, setTokenState] = useState(() => getToken());
  const [loading, setLoading] = useState(true);

  // Restore & verify authentication session on app initialization
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken();
      if (!storedToken) {
        setUser(null);
        setTokenState(null);
        setLoading(false);
        return;
      }

      try {
        const userData = await getMe();
        if (userData && (userData.id || userData._id)) {
          const userWithAvatar = {
            ...userData,
            id: userData.id || userData._id,
            avatar: getAvatar(userData.name),
          };
          setUser(userWithAvatar);
          setTokenState(storedToken);

          // Keep stored user payload updated with freshly verified backend data
          if (localStorage.getItem('drivefleet_token')) {
            localStorage.setItem('drivefleet_user', JSON.stringify(userWithAvatar));
          } else {
            sessionStorage.setItem('drivefleet_user', JSON.stringify(userWithAvatar));
          }
        } else {
          // Invalid response, clear stale session
          removeToken();
          localStorage.removeItem('drivefleet_user');
          sessionStorage.removeItem('drivefleet_user');
          setUser(null);
          setTokenState(null);
        }
      } catch (err) {
        console.warn('Authentication session verification failed:', err.message);
        removeToken();
        localStorage.removeItem('drivefleet_user');
        sessionStorage.removeItem('drivefleet_user');
        setUser(null);
        setTokenState(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * login — Authenticate against backend POST /api/auth/login
   */
  const login = async (email, password, remember = true) => {
    try {
      const response = await loginUser({ email, password });
      const rawUser = response.user || response.data;
      const userToken = response.token;

      if (!userToken || !rawUser) {
        throw new Error('Invalid response received from authentication server.');
      }

      const userWithAvatar = {
        ...rawUser,
        id: rawUser.id || rawUser._id,
        avatar: getAvatar(rawUser.name),
      };

      setToken(userToken, remember);
      if (remember) {
        localStorage.setItem('drivefleet_user', JSON.stringify(userWithAvatar));
        sessionStorage.removeItem('drivefleet_user');
      } else {
        sessionStorage.setItem('drivefleet_user', JSON.stringify(userWithAvatar));
        localStorage.removeItem('drivefleet_user');
      }

      setUser(userWithAvatar);
      setTokenState(userToken);

      return { success: true, user: userWithAvatar, token: userToken };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid email or password.' };
    }
  };

  /**
   * register — Create new user via backend POST /api/auth/register
   */
  const register = async (userData) => {
    try {
      const response = await registerUser(userData);
      const rawUser = response.user || response.data;
      const userToken = response.token;

      if (userToken && rawUser) {
        const userWithAvatar = {
          ...rawUser,
          id: rawUser.id || rawUser._id,
          avatar: getAvatar(rawUser.name),
        };
        setToken(userToken, true);
        localStorage.setItem('drivefleet_user', JSON.stringify(userWithAvatar));
        sessionStorage.removeItem('drivefleet_user');
        setUser(userWithAvatar);
        setTokenState(userToken);
      }

      return {
        success: true,
        message: response.message || 'User registered successfully',
        user: rawUser,
        token: userToken,
      };
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  /**
   * logout — Clears authentication tokens and user state
   */
  const logout = () => {
    removeToken();
    localStorage.removeItem('drivefleet_user');
    sessionStorage.removeItem('drivefleet_user');
    setUser(null);
    setTokenState(null);
  };

  const value = {
    user,
    currentUser: user,
    token: tokenState,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
