import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedAccess = localStorage.getItem('accessToken');
    const savedRefresh = localStorage.getItem('refreshToken');
    const savedUser = localStorage.getItem('user');

    if (savedAccess && savedRefresh && savedUser) {
      setAccessToken(savedAccess);
      setRefreshToken(savedRefresh);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });

    // 2FA Gerekli mi?
    if (res.data.is2FARequired) {
      return res.data; // { is2FARequired: true, tempToken: '...' }
    }

    const { accessToken: at, refreshToken: rt, user: u } = res.data;
    localStorage.setItem('accessToken', at);
    localStorage.setItem('refreshToken', rt);
    localStorage.setItem('user', JSON.stringify(u));
    setAccessToken(at);
    setRefreshToken(rt);
    setUser(u);
    return u;
  }, []);

  const verify2FALogin = useCallback(async (tempToken, code) => {
    const res = await api.post('/auth/2fa/login', { tempToken, code });
    const { accessToken: at, refreshToken: rt, user: u } = res.data;

    localStorage.setItem('accessToken', at);
    localStorage.setItem('refreshToken', rt);
    localStorage.setItem('user', JSON.stringify(u));
    setAccessToken(at);
    setRefreshToken(rt);
    setUser(u);
    return u;
  }, []);

  const refresh = useCallback(async () => {
    if (!refreshToken) return null;
    const res = await api.post('/auth/refresh', { refreshToken });
    const at = res.data.accessToken;
    localStorage.setItem('accessToken', at);
    setAccessToken(at);
    return at;
  }, [refreshToken]);

  const logout = useCallback(async () => {
    const rt = localStorage.getItem('refreshToken');
    if (rt) {
      try {
        await api.post('/auth/logout', { refreshToken: rt });
      } catch (err) {
        // ignore logout errors
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    accessToken,
    refreshToken,
    loading,
    isAuthenticated: !!user && !!accessToken,
    login,
    verify2FALogin,
    refresh,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
