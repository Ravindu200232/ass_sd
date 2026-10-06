import React, { createContext, useContext, useState, useEffect } from 'react';

import api from '@/lib/api';
import {
  clearAllAppStorage,
  getAuthToken,
  setAuthToken,
  setUser,
} from '@/lib/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/**
 * Tag the OneSignal push audience, when the native wrapper has injected it.
 *
 * Extracted because the original code did this inline in three places using
 * two different OneSignal APIs, and because a failure here must never break
 * authentication.
 */
const tagPushAudience = (userData) => {
  try {
    if (window.OneSignal?.push) {
      window.OneSignal.push(() => {
        window.OneSignal.sendTags({
          role: userData.role,
          user_code: userData.user_code,
        });
      });
    }
  } catch {
    /* push tagging is best-effort and must not affect login */
  }
};

const untagPushAudience = () => {
  try {
    if (window.OneSignal?.push) {
      window.OneSignal.push(() => {
        window.OneSignal.deleteTags(['role', 'user_code']);
      });
    }
  } catch {
    /* ignore */
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------
  // Restore session  [V-16]
  //
  // This used to be:
  //
  //     const token = getAuthToken();
  //     const userData = getUser();
  //     if (token && userData) setUserState(userData);
  //
  // The user record - including its `role` - was believed verbatim, straight
  // out of localStorage, with no server involvement at all. Anyone could type
  //
  //     localStorage.setItem('user', JSON.stringify({role:'admin'}))
  //     localStorage.setItem('authToken', 'anything')
  //
  // and reload into the administrator UI. Every admin gate in App.jsx is a
  // comparison against this value.
  //
  // Now the token is presented to the server and the SERVER says who the user
  // is. A token that has expired, been revoked, or belongs to a deactivated
  // account (all V-06) fails here and the session is discarded, instead of the
  // UI staying open until the next API call happens to fail.
  // ---------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const token = getAuthToken();

      if (!token) {
        setLoading(false);

        return;
      }

      try {
        const response = await api.get('/me');
        const userData = response.data?.data ?? response.data?.user ?? null;

        if (cancelled) return;

        if (!userData) {
          throw new Error('No user returned by /me');
        }

        // Refresh the display cache from the authoritative copy.
        setUser(userData);
        setUserState(userData);
        tagPushAudience(userData);
      } catch {
        if (cancelled) return;

        // The token is no good. Do not fall back to the cached user record:
        // that is exactly the behaviour being removed.
        clearAllAppStorage();
        setUserState(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, []);

  // 🔐 LOGIN
  const login = async (username, password) => {
    try {
      const response = await api.post('/login', { username, password });

      const { user: userData, token } = response.data.data;

      setAuthToken(token);
      setUser(userData);
      setUserState(userData);
      tagPushAudience(userData);

      return { success: true, data: userData };
    } catch (error) {
      return {
        success: false,
        // V-05a: the server now returns one generic message for both an unknown
        // username and a wrong password, so there is nothing here to
        // differentiate. Surface whatever it said.
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  // 🚪 LOGOUT
  const logout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // The token may already be revoked or expired; clearing locally is still
      // the right outcome. Nothing is logged: the original code wrote the error
      // object to the console.
    } finally {
      untagPushAudience();

      // V-16: clears the token, the user cache AND the invoice/GRN drafts,
      // cost prices and cached catalogue that the old logout left behind on a
      // shared shop terminal.
      clearAllAppStorage();
      setUserState(null);
    }
  };

  /**
   * Adopt a session that was established by a flow other than the password
   * form - currently Google OIDC.
   *
   * The token and user record have already been issued and verified by the
   * BACKEND; this only stores them and updates React state. Nothing here
   * decides who the user is, which is the whole point of V-16: the server is
   * the authority, and the very next app boot re-confirms it through GET /me.
   */
  const adoptSession = (userData, token) => {
    setAuthToken(token);
    setUser(userData);
    setUserState(userData);
    tagPushAudience(userData);
  };

  /**
   * Re-fetch the user from the server.
   *
   * Useful after an administrator changes someone's role or department: the
   * client picks up the change without a full re-login.
   */
  const refreshUser = async () => {
    try {
      const response = await api.get('/me');
      const userData = response.data?.data ?? null;

      if (userData) {
        setUser(userData);
        setUserState(userData);
      }

      return userData;
    } catch {
      return null;
    }
  };

  const value = {
    user,
    login,
    logout,
    adoptSession,
    refreshUser,
    loading,

    // For RENDERING decisions only. The server enforces authorisation on every
    // request (V-01/V-02) and strips cost/margin fields for employees, so a
    // tampered client cannot turn these into actual privilege.
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
