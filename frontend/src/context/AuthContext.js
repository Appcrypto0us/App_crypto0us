import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import API from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  const fetchUser = useCallback(async () => {
    try {
      const res = await API.get('/auth/me');
      setUser(res.data.user);
      setWallet(res.data.wallet);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (phone, pin) => {
    const res = await API.post('/auth/login', { phone, pin });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    setWallet(res.data.wallet);
    return res.data;
  };

  const register = async (data) => {
    const res = await API.post('/auth/register', data);
    return res.data;
  };

  const verifyOTP = async (email, otp) => {
    const res = await API.post('/auth/verify-otp', { email, otp });
    return res.data;
  };

  const resendOTP = async (email) => {
    const res = await API.post('/auth/resend-otp', { email });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setWallet(null);
  };

  const updateWallet = (newWallet) => setWallet(newWallet);

  const value = {
    user,
    wallet,
    loading,
    login,
    register,
    verifyOTP,
    resendOTP,
    logout,
    updateWallet,
    fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
