import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkMode';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function OTPScreen({ route, navigation }) {
  const { email } = route.params;
  const { verifyOtp, resendOtp } = useAuth();
  const { isDarkMode } = useDarkMode();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Perhatian', 'Kode OTP harus berupa 6 digit angka');
      return;
    }

    setIsLoading(true);
    const res = await verifyOtp(email, otp);
    setIsLoading(false);

    if (res && res.success) {
      Alert.alert('Sukses', 'Email berhasil diverifikasi! Selamat datang.');
      // State login di AuthContext akan reaktif mendeteksi isLoggedIn = true
      // dan secara otomatis mengalihkan navigasi ke MainTabs
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    const success = await resendOtp(email);
    setIsResending(false);
    if (success) {
      setCountdown(60);
    }
  };

  const theme = {
    bg: isDarkMode ? '#111827' : '#f9fafb',
    card: isDarkMode ? '#1f2937' : '#fff',
    title: isDarkMode ? '#f0f0f0' : '#333',
    subtitle: isDarkMode ? '#9ca3af' : '#666',
    inputBg: isDarkMode ? '#111827' : '#fff',
    inputBorder: isDarkMode ? '#374151' : '#ddd',
    inputText: isDarkMode ? '#f0f0f0' : '#333',
    inputPlaceholder: isDarkMode ? '#6b7280' : '#aaa',
    linkText: isDarkMode ? '#9ca3af' : '#555',
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.bg }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <Text style={[styles.title, { color: theme.title }]}>
          Verifikasi Email ✉️
        </Text>
        <Text style={[styles.subtitle, { color: theme.subtitle }]}>
          Masukkan kode OTP 6 digit yang telah dikirim ke email:{'\n'}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>

        <View style={[styles.form, { backgroundColor: theme.card }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText,
              },
            ]}
            placeholder="------"
            placeholderTextColor={theme.inputPlaceholder}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            textAlign="center"
          />

          <TouchableOpacity activeOpacity={0.8} onPress={handleVerify} disabled={isLoading}>
            <LinearGradient
              colors={['#4A70A9', '#2D4365']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.button}
            >
              <View style={styles.buttonContent}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="checkbox-marked-circle-outline" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Verifikasi</Text>
                  </>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {countdown > 0 ? (
              <Text style={[styles.countdownText, { color: theme.subtitle }]}>
                Kirim ulang OTP dalam {countdown} detik
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={isResending}>
                <Text style={styles.resendText}>
                  {isResending ? 'Mengirim...' : 'Kirim Ulang OTP'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 60,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 30,
  },
  emailHighlight: {
    fontWeight: 'bold',
    color: '#4A70A9',
  },
  form: {
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 100,
    padding: 15,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 10,
    marginBottom: 20,
  },
  button: {
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  countdownText: {
    fontSize: 14,
  },
  resendText: {
    color: '#4A70A9',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});
