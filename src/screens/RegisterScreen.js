import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDarkMode } from '../contexts/DarkMode';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photo, setPhoto] = useState(null);
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [bankName, setBankName] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode } = useDarkMode();

  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.5,
        selectionLimit: 1,
        maxWidth: 800,
        maxHeight: 800,
      },
      response => {
        if (!response.didCancel && !response.errorMessage) {
          const file = response.assets[0];

          // Cek ukuran file — tolak kalau > 5MB
          if (file.fileSize && file.fileSize > 5 * 1024 * 1024) {
            Alert.alert(
              'Foto terlalu besar',
              'Pilih foto yang lebih kecil dari 5MB, atau gunakan screenshot.',
            );
            return;
          }

          setPhoto(file);
        }
      },
    );
  };

  const paymentMethods = [
    { label: 'Bank Transfer', value: 'bank_transfer', icon: 'bank' },
    { label: 'E-Wallet', value: 'e_wallet', icon: 'wallet' },
  ];

  const handleRegister = async () => {
    if (isLoading) return;
    console.log('📋 Data yang akan dikirim:', {
      name,
      email,
      phone,
      paymentMethod,
      bankName,
      paymentAccount,
      accountHolder,
      photo: photo ? photo.uri : 'TIDAK ADA',
    });
    if (
      !name ||
      !email ||
      !password ||
      !photo ||
      !phone ||
      !paymentMethod ||
      !bankName ||
      !paymentAccount ||
      !accountHolder
    ) {
      Alert.alert('Lengkapi semua data!');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password tidak cocok');
      return;
    }

    setIsLoading(true);

    const success = await register(
      name,
      email,
      password,
      photo,
      phone,
      paymentMethod,
      bankName,
      paymentAccount,
      accountHolder,
    );

    setIsLoading(false);

    if (success) {
      Alert.alert('Sukses', 'Akun berhasil dibuat! Silakan login.');
      navigation.navigate('Login');
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
      contentContainerStyle={[
        styles.scrollContainer,
        { backgroundColor: theme.bg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <Text style={[styles.title, { color: theme.title }]}>
          Buat Akun Baru ✨
        </Text>
        <Text style={[styles.subtitle, { color: theme.subtitle }]}>
          Daftar untuk mulai membagi tagihanmu
        </Text>

        <View style={[styles.form, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={[styles.imagePicker, { backgroundColor: theme.inputBg }]}
            onPress={pickImage}
          >
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.image} />
            ) : (
              <Text style={[styles.imageText, { color: theme.inputText }]}>
                Pilih Foto Profil
              </Text>
            )}
          </TouchableOpacity>

          {!photo && (
            <Text style={styles.photoHint}>*Maksimal ukuran foto 5MB!</Text>
          )}

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.inputText,
              },
            ]}
            placeholder="Nama Lengkap"
            placeholderTextColor={theme.inputPlaceholder}
            onChangeText={setName}
            value={name}
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
            placeholder="Email"
            placeholderTextColor={theme.inputPlaceholder}
            onChangeText={setEmail}
            value={email}
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
            value={password}
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
            placeholder="Konfirmasi Password"
            placeholderTextColor={theme.inputPlaceholder}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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
            placeholder="Nomor Telepon"
            placeholderTextColor={theme.inputPlaceholder}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <View
            style={[styles.paymentSection, { backgroundColor: theme.card }]}
          >
            <Text style={[styles.sectionLabel, { color: theme.inputText }]}>
              Metode Pembayaran *
            </Text>

            {/* Pilihan metode pembayaran */}
            <View style={styles.paymentMethods}>
              {paymentMethods.map(method => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.paymentMethodChip,
                    paymentMethod === method.value &&
                      styles.paymentMethodChipActive,
                  ]}
                  onPress={() => {
                    setPaymentMethod(method.value);
                    // Reset field terkait kalau ganti metode
                    setBankName('');
                    setPaymentAccount('');
                    setAccountHolder('');
                  }}
                >
                  <Icon
                    name={method.icon}
                    size={16}
                    color={paymentMethod === method.value ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === method.value &&
                        styles.paymentMethodTextActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentMethod === 'bank_transfer' && (
              <>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.inputText,
                    },
                  ]}
                  placeholder="Nama Bank (BCA, Mandiri, BRI) *"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={bankName}
                  onChangeText={setBankName}
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
                  placeholder="Nomor Rekening *"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={paymentAccount}
                  onChangeText={setPaymentAccount}
                  keyboardType="numeric"
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
                  placeholder="Atas Nama *"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={accountHolder}
                  onChangeText={setAccountHolder}
                />
              </>
            )}

            {paymentMethod === 'e_wallet' && (
              <>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.inputText,
                    },
                  ]}
                  placeholder="Nama E-Wallet (OVO, GoPay, Dana) *"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={bankName}
                  onChangeText={setBankName}
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
                  placeholder="Nomor E-Wallet *"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={paymentAccount}
                  onChangeText={setPaymentAccount}
                  keyboardType="numeric"
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
                  placeholder="Atas Nama *"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={accountHolder}
                  onChangeText={setAccountHolder}
                />
              </>
            )}
          </View>

          <TouchableOpacity activeOpacity={0.8} onPress={handleRegister}>
            <LinearGradient
              colors={['#4A70A9', '#2D4365']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.button}
            >
              <View style={styles.titleContainer}>
                <Icon name="account-plus" size={18} color="#fff" />
                <Text style={styles.buttonText}>
                  {isLoading ? 'Mendaftar...' : 'Daftar'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.link, { color: theme.linkText }]}>
              Sudah punya akun? <Text style={styles.linkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
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
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginTop: 5,
    marginBottom: 30,
    fontSize: 14,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  imagePicker: {
    backgroundColor: '#f3f4f6',
    height: 120,
    borderRadius: 10,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    color: '#555',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginTop: -5,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 100,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  button: {
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    marginTop: 15,
    color: '#555',
  },
  linkBold: {
    color: '#4A70A9',
    fontWeight: '600',
  },
  paymentSection: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  paymentMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  paymentMethodChipActive: {
    backgroundColor: '#4A70A9',
    borderColor: '#4A70A9',
  },
  paymentMethodText: {
    fontSize: 12,
    color: '#666',
  },
  paymentMethodTextActive: {
    color: '#fff',
  },
});
