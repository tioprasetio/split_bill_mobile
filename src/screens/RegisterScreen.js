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

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, response => {
      if (!response.didCancel && !response.errorMessage) {
        const file = response.assets[0];
        setPhoto(file);
      }
    });
  };

  const paymentMethods = [
    { label: 'Bank Transfer', value: 'bank_transfer' },
    { label: 'E-Wallet', value: 'e_wallet' },
  ];

  const handleRegister = async () => {
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

    await register(
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

    Alert.alert('Sukses', 'Akun berhasil dibuat! Silakan login.');
    navigation.navigate('Login');
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Buat Akun Baru ✨</Text>
        <Text style={styles.subtitle}>
          Daftar untuk mulai membagi tagihanmu
        </Text>

        <View style={styles.form}>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.image} />
            ) : (
              <Text style={styles.imageText}>Pilih Foto Profil</Text>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Nama Lengkap"
            placeholderTextColor="#aaa"
            onChangeText={setName}
            value={name}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#aaa"
            onChangeText={setEmail}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
          />

          <TextInput
            style={styles.input}
            placeholder="Konfirmasi Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TextInput
            style={styles.input}
            placeholder="Nomor Telepon"
            placeholderTextColor="#aaa"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <View style={styles.paymentSection}>
            <Text style={styles.sectionLabel}>Metode Pembayaran *</Text>

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
                  style={styles.input}
                  placeholder="Nama Bank (BCA, Mandiri, BRI) *"
                  placeholderTextColor="#aaa"
                  value={bankName}
                  onChangeText={setBankName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nomor Rekening *"
                  placeholderTextColor="#aaa"
                  value={paymentAccount}
                  onChangeText={setPaymentAccount}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Atas Nama *"
                  placeholderTextColor="#aaa"
                  value={accountHolder}
                  onChangeText={setAccountHolder}
                />
              </>
            )}

            {paymentMethod === 'e_wallet' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nama E-Wallet (OVO, GoPay, Dana) *"
                  placeholderTextColor="#aaa"
                  value={bankName}
                  onChangeText={setBankName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nomor E-Wallet *"
                  placeholderTextColor="#aaa"
                  value={paymentAccount}
                  onChangeText={setPaymentAccount}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Atas Nama *"
                  placeholderTextColor="#aaa"
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
              <Text style={styles.buttonText}>Daftar</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>
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
