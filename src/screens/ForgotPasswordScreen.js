import React, { useState } from 'react';
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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Masukkan email kamu');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/forgot-password`, {
        email: email.trim().toLowerCase(),
      });
      setSent(true);
    } catch (err) {
      // Tetap tampilkan pesan sukses meski error, untuk keamanan
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 48,
      backgroundColor: '#f9fafb',
    },
    backButton: {
      flexDirection: 'row',
      position: 'absolute',
      top: 48,
      left: 24,
      alignItems: 'center',
      gap: 4,
      zIndex: 10,
    },
    backText: {
      fontSize: 14,
      color: '#333333',
      fontWeight: '700',
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
    input: {
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 100,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: '#111827',
      marginBottom: 20,
    },
    button: {
      borderRadius: 100,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    buttonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 15,
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
      paddingHorizontal: 8,
    },
    noteCard: {
      backgroundColor: '#dbeafe',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    noteText: {
      fontSize: 13,
      color: '#1e40af',
      flex: 1,
      lineHeight: 20,
    },
    resendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
    },
    resendLabel: {
      fontSize: 14,
      color: '#6b7280',
    },
    resendLink: {
      fontSize: 14,
      color: '#4A70A9',
      fontWeight: '600',
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={18} color="#333333" />
        <Text style={styles.backText}>Kembali ke Login</Text>
      </TouchableOpacity>

      {!sent ? (
        <>
          <View style={styles.iconContainer}>
            <Icon name="lock-reset" size={32} color="#4A70A9" />
          </View>

          <Text style={styles.title}>Lupa Password?</Text>
          <Text style={styles.subtitle}>
            Masukkan email yang terdaftar. Kami akan mengirimkan link untuk
            reset password kamu.
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="emailkamu@gmail.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleForgotPassword}
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
                <Text style={styles.buttonText}>Kirim Link Reset</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Icon name="email-check" size={36} color="#16a34a" />
          </View>

          <Text style={styles.successTitle}>Email Terkirim!</Text>
          <Text style={styles.successText}>
            Link reset password sudah dikirim ke{'\n'}
            <Text style={{ fontWeight: '600', color: '#111827' }}>
              {email}
            </Text>
            {'\n\n'}
            Cek inbox atau folder spam kamu.
          </Text>

          <View style={styles.noteCard}>
            <Icon name="information" size={16} color="#1e40af" />
            <Text style={styles.noteText}>
              Link berlaku selama 15 menit. Jika tidak menerima email, coba
              kirim ulang atau periksa folder spam.
            </Text>
          </View>

          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Tidak menerima email?</Text>
            <TouchableOpacity
              onPress={() => {
                setSent(false);
              }}
            >
              <Text style={styles.resendLink}>Kirim Ulang</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}