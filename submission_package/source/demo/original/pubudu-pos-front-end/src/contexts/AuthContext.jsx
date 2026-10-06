import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getUser,
  setUser,
  removeUser
} from '@/lib/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Restore session
  useEffect(() => {
    const token = getAuthToken();
    const userData = getUser();

    if (token && userData) {
      setUserState(userData);

      // ✅ STEP 06-A: Restore OneSignal tags (app reopen)
      if (window.OneSignal && window.OneSignal.push) {
        window.OneSignal.push(() => {
          window.OneSignal.sendTags({
            role: userData.role,
            user_code: userData.user_code,
          });
        });
      }
    }

    setLoading(false);
  }, []);

  // 🔐 LOGIN
  const login = async (username, password) => {
    try {
      const response = await api.post('/login', {
        username,
        password,
      });

      const { user: userData, token } = response.data.data;

      setAuthToken(token);
      setUser(userData);
      setUserState(userData);

      // ✅ STEP 06-B: Tag OneSignal on login (MOST IMPORTANT)
      if (window.OneSignal && window.OneSignal.push) {
        window.OneSignal.push(() => {
          window.OneSignal.sendTags({
            role: userData.role,           // admin / employee
            user_code: userData.user_code, // EMP001 / ADM001
          });
        });
      }

      return { success: true, data: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  // 🚪 LOGOUT
  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // ✅ STEP 06-C: Remove OneSignal tags (VERY IMPORTANT)
      if (window.OneSignal && window.OneSignal.push) {
        window.OneSignal.push(() => {
          window.OneSignal.deleteTags(['role', 'user_code']);
        });
      }

      removeAuthToken();
      removeUser();
      setUserState(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
