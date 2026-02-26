import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

import { Alert } from 'react-native';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔒 Cek masa berlaku token
  const checkTokenExpiration = token => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp >= currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  };

  // 🔐 LOGIN
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/login`, {
        email,
        password,
      });
      const { token, user: userData } = response.data;

      await AsyncStorage.setItem('token', token);
      setUser(userData);
      setIsLoggedIn(true);
      setLoading(false);
    } catch (error) {
      console.log('Login error:', error);
      Alert.alert(
        'Login gagal',
        error.response?.data?.message || 'Email atau password salah',
      );
    }
  };

  // 🧾 REGISTER
  const register = async (
    name,
    email,
    password,
    photo,
    phone,
    paymentMethod,
    bankName,
    paymentAccount,
    accountHolder,
  ) => {
    try {
      console.log('📤 Sending register data:', {
        name,
        email,
        password: '***',
        phone,
        paymentMethod,
        paymentAccount,
        bankName,
        accountHolder,
        photo: photo ? 'Ada' : 'Tidak ada',
      });
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('phone', phone);
      formData.append('payment_method', paymentMethod);
      formData.append('bank_name', bankName);
      formData.append('payment_account', paymentAccount);
      formData.append('account_holder', accountHolder);

      if (photo) {
        formData.append('profile_picture', {
          uri: photo.uri,
          type: photo.type,
          name: photo.fileName || 'profile.jpg',
        });
      }

      await axios.post(`${API_URL}/api/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Berhasil', 'Akun berhasil dibuat!');
    } catch (error) {
      console.log('Register error:', error.response?.data || error.message);
      Alert.alert(
        'Gagal daftar',
        error.response?.data?.message || 'Terjadi kesalahan',
      );
    }
  };

  // 🚪 LOGOUT
  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
    setIsLoggedIn(false);
    setLoading(false);
  };

  // 🧠 CEK USER DARI TOKEN
  const checkUser = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');

    if (!token || !checkTokenExpiration(token)) {
      await AsyncStorage.removeItem('token');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(response.data.user);
      setIsLoggedIn(true);
    } catch (err) {
      console.warn('Token invalid, removing...', err);
      await AsyncStorage.removeItem('token');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // 🕓 Cek token tiap 30 menit
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = await AsyncStorage.getItem('token');
      if (token && !checkTokenExpiration(token)) {
        Alert.alert('Sesi Berakhir', 'Silakan login kembali.');
        logout();
      }
    }, 1800000); // 30 menit
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, loading, login, register, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
