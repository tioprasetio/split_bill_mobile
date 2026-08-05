// src/screens/ResetPasswordScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '@env';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDarkMode } from '../contexts/DarkMode';

export default function ResetPasswordScreen({ route, navigation }) {
  const { isDarkMode } = useDarkMode();
  // Ambil token dari route params (dikirim dari deep link handler)
  const [token] = useState(route.params?.token || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  const theme = {
    bg: isDarkMode ? '#111827' : '#f9fafb',
    iconContainer: isDarkMode ? '#1f2937' : '#DCEAFF',
    title: isDarkMode ? '#f0f0f0' : '#111827',
    subtitle: isDarkMode ? '#9ca3af' : '#6b7280',
    label: isDarkMode ? '#d1d5db' : '#374151',
    inputBg: isDarkMode ? '#1f2937' : '#fff',
    inputBorder: isDarkMode ? '#374151' : '#d1d5db',
    inputText: isDarkMode ? '#f0f0f0' : '#111827',
    inputPlaceholder: isDarkMode ? '#6b7280' : '#9ca3af',
    errorTitle: isDarkMode ? '#f87171' : '#111827',
    errorText: isDarkMode ? '#9ca3af' : '#6b7280',
    successTitle: isDarkMode ? '#f0f0f0' : '#111827',
    successText: isDarkMode ? '#9ca3af' : '#6b7280',
  };

  useEffect(() => {
    console.log('ResetPasswordScreen mounted');
    console.log('Token from params:', route.params?.token);

    // Jika tidak ada token, tampilkan error
    if (!token) {
      setTokenError(true);
    }
  }, [token, route.params?.token]);

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Semua field wajib diisi');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Konfirmasi password tidak cocok');
      return;
    }
    if (!token) {
      Alert.alert('Error', 'Token reset tidak ditemukan');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/reset-password`, {
        token,
        newPassword,
      });
      console.log('Reset response:', response.data);
      setSuccess(true);
    } catch (err) {
      console.error('Reset error:', err.response?.data || err.message);
      const msg = err.response?.data?.error || 'Gagal reset password';
      if (msg.includes('kadaluarsa') || msg.includes('expired')) {
        Alert.alert(
          'Link Kadaluarsa',
          'Link reset sudah tidak berlaku. Silakan minta link baru.',
          [
            {
              text: 'Minta Link Baru',
              onPress: () => navigation.navigate('ForgotPassword'),
            },
            { text: 'Batal', style: 'cancel' },
          ],
        );
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get password strength (sama seperti sebelumnya)
  const getPasswordStrength = password => {
    if (!password) return null;
    if (password.length < 6)
      return { label: 'Terlalu pendek', color: '#ef4444', width: '20%' };
    if (password.length < 8)
      return { label: 'Lemah', color: '#f97316', width: '40%' };
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);
    const score = [hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
    if (score === 0) return { label: 'Sedang', color: '#eab308', width: '60%' };
    if (score === 1) return { label: 'Kuat', color: '#22c55e', width: '80%' };
    return { label: 'Sangat kuat', color: '#16a34a', width: '100%' };
  };

  const strength = getPasswordStrength(newPassword);
  const passwordMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  // Styles (sama seperti sebelumnya)
  const styles = StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 48,
      backgroundColor: '#f9fafb',
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#DCEAFF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      alignSelf: 'center',
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: '#111827',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: '#6b7280',
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: '#374151',
      marginBottom: 6,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 100,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    input: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 15,
      color: '#111827',
    },
    strengthBar: {
      height: 4,
      borderRadius: 2,
      backgroundColor: '#e5e7eb',
      marginBottom: 4,
      overflow: 'hidden',
    },
    strengthFill: {
      height: '100%',
      borderRadius: 2,
    },
    strengthLabel: {
      fontSize: 12,
      marginBottom: 16,
    },
    matchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 24,
    },
    matchText: {
      fontSize: 12,
    },
    button: {
      borderRadius: 100,
      marginTop: 8,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 15,
    },
    errorContainer: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    errorIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: '#fee2e2',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    errorTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 8,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 14,
      color: '#6b7280',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    successContainer: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    successIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: '#dcfce7',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    successTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 8,
      textAlign: 'center',
    },
    successText: {
      fontSize: 14,
      color: '#6b7280',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 32,
    },
  });

  // Token error state
  if (tokenError) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Icon name="link-variant-off" size={36} color="#dc2626" />
          </View>
          <Text style={[styles.errorTitle, { color: theme.errorTitle }]}>Link Tidak Valid</Text>
          <Text style={[styles.errorText, { color: theme.errorText }]}>
            Link reset password tidak ditemukan atau sudah kadaluarsa. Silakan
            minta link baru.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <LinearGradient
              colors={['#4A70A9', '#2D4365']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.button, { paddingHorizontal: 32 }]}
            >
              <Text style={styles.buttonText}>Minta Link Baru</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Success state
  if (success) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Icon name="check-circle" size={36} color="#16a34a" />
          </View>
          <Text style={[styles.successTitle, { color: theme.successTitle }]}>Password Berhasil Direset!</Text>
          <Text style={[styles.successText, { color: theme.successText }]}>
            Password kamu sudah diperbarui. Silakan login dengan password baru
            kamu.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Login')}
          >
            <LinearGradient
              colors={['#4A70A9', '#2D4365']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.button, { paddingHorizontal: 40 }]}
            >
              <Text style={styles.buttonText}>Login Sekarang</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Form state
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.iconContainer }]}>
        <Icon name="lock-check" size={32} color="#4A70A9" />
      </View>

      <Text style={[styles.title, { color: theme.title }]}>Buat Password Baru</Text>
      <Text style={[styles.subtitle, { color: theme.subtitle }]}>
        Password baru harus berbeda dari password sebelumnya.
      </Text>

      <Text style={[styles.label, { color: theme.label }]}>Password Baru</Text>
      <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
        <TextInput
          style={[styles.input, { color: theme.inputText }]}
          placeholder="Minimal 6 karakter"
          placeholderTextColor={theme.inputPlaceholder}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color={theme.inputPlaceholder}
          />
        </TouchableOpacity>
      </View>

      {strength && (
        <>
          <View style={styles.strengthBar}>
            <View
              style={[
                styles.strengthFill,
                { width: strength.width, backgroundColor: strength.color },
              ]}
            />
          </View>
          <Text style={[styles.strengthLabel, { color: strength.color }]}>
            Kekuatan: {strength.label}
          </Text>
        </>
      )}

      <Text style={[styles.label, { marginTop: strength ? 0 : 8, color: theme.label }]}>
        Konfirmasi Password
      </Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.inputBg,
            borderColor: passwordMismatch
              ? '#ef4444'
              : passwordMatch
              ? '#22c55e'
              : theme.inputBorder,
            marginBottom: 4,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: theme.inputText }]}
          placeholder="Ulangi password baru"
          placeholderTextColor={theme.inputPlaceholder}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirm}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
          <Icon
            name={showConfirm ? 'eye-off' : 'eye'}
            size={20}
            color={theme.inputPlaceholder}
          />
        </TouchableOpacity>
      </View>

      {confirmPassword.length > 0 && (
        <View style={[styles.matchRow, { marginBottom: 20 }]}>
          <Icon
            name={passwordMatch ? 'check-circle' : 'close-circle'}
            size={14}
            color={passwordMatch ? '#22c55e' : '#ef4444'}
          />
          <Text
            style={[
              styles.matchText,
              { color: passwordMatch ? '#22c55e' : '#ef4444' },
            ]}
          >
            {passwordMatch ? 'Password cocok' : 'Password tidak cocok'}
          </Text>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleReset}
        disabled={loading}
      >
        <LinearGradient
          colors={['#4A70A9', '#2D4365']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.button}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}
