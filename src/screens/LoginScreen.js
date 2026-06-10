import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkMode';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    console.log('Tombol login ditekan');
    try {
      await login(email, password);
      console.log('Login berhasil');
    } catch (err) {
      console.log('Error saat login:', err);
      Alert.alert('Login gagal. Periksa email/password.');
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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.title }]}>
        Selamat Datang 👋
      </Text>
      <Text style={[styles.subtitle, { color: theme.subtitle }]}>
        Masuk untuk mulai membagi tagihanmu
      </Text>

      <View
        style={[
          styles.form,
          {
            backgroundColor: theme.card,
            shadowColor: isDarkMode ? '#000' : '#000',
            shadowOpacity: isDarkMode ? 0.4 : 0.1,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.inputBorder,
              color: theme.inputText,
            },
          ]}
          placeholder="Email"
          placeholderTextColor={theme.inputPlaceholder}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.inputBorder,
              color: theme.inputText,
            },
          ]}
          placeholder="Password"
          placeholderTextColor={theme.inputPlaceholder}
          secureTextEntry
          onChangeText={setPassword}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={{ alignSelf: 'flex-start', marginBottom: 15 }}
        >
          <View style={styles.titleContainer}>
            <Icon name="autorenew" size={18} color="#4A70A9" />
            <Text style={styles.forgotText}>Lupa Password?</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} onPress={handleLogin}>
          <LinearGradient
            colors={['#4A70A9', '#2D4365']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.button}
          >
            <View style={styles.titleContainer}>
              <Icon name="login" size={18} color="#fff" />
              <Text style={styles.buttonText}>Login</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.link, { color: theme.linkText }]}>
            Belum punya akun? <Text style={styles.linkBold}>Daftar</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 30,
    fontSize: 14,
  },
  form: {
    borderRadius: 15,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 100,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  forgotText: {
    color: '#4A70A9',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
  },
  button: {
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    marginTop: 15,
  },
  linkBold: {
    color: '#4A70A9',
    fontWeight: '600',
  },
});
