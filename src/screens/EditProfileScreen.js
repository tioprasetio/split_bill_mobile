// screens/EditProfileScreen.js
import React, { useEffect, useRef, useState } from 'react';
import { API_URL } from '@env';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkMode';

// ── Constants ─────────────────────────────────────────────────────────────────
const C = {
  primary: '#4A70A9',
  secondary: '#4A70A9',
  danger: '#CF262B',
  warning: '#d97706',
  darkBg: '#111827',
  lightBg: '#f4f6f9',
  darkCard: '#1f2937',
  lightCard: '#ffffff',
  darkInput: '#111827',
  lightInput: '#f9fafb',
  textDark: '#111827',
  textLight: '#f9fafb',
  muted: '#6b7280',
  border: '#e0e0e0',
  borderDark: '#374151',
};

const PAYMENT_METHODS = [
  { key: 'bank_transfer', label: 'Transfer Bank', icon: 'bank-outline' },
  { key: 'e_wallet', label: 'E-Wallet', icon: 'wallet-outline' },];

const DEFAULT_AVATAR =
  'https://static.vecteezy.com/system/resources/previews/054/343/112/non_2x/a-person-icon-in-a-circle-free-png.png';

// ── Toast component ───────────────────────────────────────────────────────────
const Toast = ({ message, type }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(anim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [anim, message, type]);

  const bg =
    type === 'success' ? '#064e3b' : type === 'error' ? '#7f1d1d' : '#1e3a5f';

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: bg,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Icon
        name={
          type === 'success'
            ? 'check-circle'
            : type === 'error'
            ? 'alert-circle'
            : 'information'
        }
        size={16}
        color="#fff"
      />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

// ── Section header ────────────────────────────────────────────────────────────
const Section = ({ icon, title, isDark }) => (
  <View style={styles.sectionHeader}>
    <View
      style={[
        styles.sectionIcon,
        { backgroundColor: isDark ? '#4A70A9' : '#f4f6f9' },
      ]}
    >
      <Icon name={icon} size={16} color={isDark ? C.lightBg : C.primary} />
    </View>
    <Text
      style={[
        styles.sectionTitle,
        { color: isDark ? C.textLight : C.textDark },
      ]}
    >
      {title}
    </Text>
    <View
      style={[
        styles.sectionLine,
        { backgroundColor: isDark ? C.borderDark : C.border },
      ]}
    />
  </View>
);

// ── Field component ───────────────────────────────────────────────────────────
const Field = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  isDark,
  multiline,
  editable = true,
  rightElement,
}) => (
  <View style={styles.fieldWrap}>
    <Text style={[styles.fieldLabel, { color: isDark ? '#9ca3af' : C.muted }]}>
      {label}
    </Text>
    <View
      style={[
        styles.fieldRow,
        {
          backgroundColor: isDark ? C.darkInput : C.lightInput,
          borderColor: isDark ? C.borderDark : C.border,
          opacity: editable ? 1 : 0.6,
        },
      ]}
    >
      <Icon
        name={icon}
        size={18}
        color={editable ? C.primary : C.muted}
        style={{ marginRight: 10 }}
      />
      <TextInput
        style={[
          styles.fieldInput,
          { color: isDark ? C.textLight : C.textDark },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboardType || 'default'}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        editable={editable}
        autoCapitalize="none"
      />
      {rightElement}
    </View>
  </View>
);

// ── Main screen ───────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useAuth();
  const { isDarkMode: isDark } = useDarkMode();
  const isFocused = useIsFocused();

  const bg = isDark ? C.darkBg : C.lightBg;
  const card = isDark ? C.darkCard : C.lightCard;

  // Form state
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    payment_method: user?.payment_method || 'bank_transfer',
    payment_account: user?.payment_account || '',
    bank_name: user?.bank_name || '',
    account_holder: user?.account_holder || '',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [showPwd, setShowPwd] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setPwd = (key, val) => setPasswords(p => ({ ...p, [key]: val }));

  const showToast = (message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Pick photo ──────────────────────────────────────────────────────────────
  const pickPhoto = async () => {
    if (!isFocused) return;
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.5,
        selectionLimit: 1,
        maxWidth: 800,
        maxHeight: 800,
      });
      if (result.didCancel) return;
      if (result.assets?.length > 0) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
        setPhotoFile({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'photo.jpg',
        });
      }
    } catch (err) {
      console.error('pickPhoto error:', err);
    }
  };

  // ── Save profile ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('Nama tidak boleh kosong', 'error');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      showToast('Email tidak valid', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('payment_method', form.payment_method);
      formData.append('payment_account', form.payment_account);
      formData.append('bank_name', form.bank_name);
      formData.append('account_holder', form.account_holder);

      if (photoFile) {
        formData.append('profile_picture', photoFile);
      }

      const res = await fetch(`${API_URL}/api/update`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || 'Gagal menyimpan profil', 'error');
        return;
      }

      // Update context
      if (setUser) setUser(prev => ({ ...prev, ...data.user }));

      // Update AsyncStorage token jika email berubah
      showToast('Profil berhasil disimpan!', 'success');
    } catch (err) {
      console.error('handleSave error:', err);
      showToast('Terjadi kesalahan, coba lagi', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Change password ─────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!passwords.current) {
      showToast('Masukkan password lama', 'error');
      return;
    }
    if (passwords.new.length < 6) {
      showToast('Password baru minimal 6 karakter', 'error');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showToast('Konfirmasi password tidak cocok', 'error');
      return;
    }

    try {
      setPwdLoading(true);
      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${API_URL}/api/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || 'Gagal ganti password', 'error');
        return;
      }

      setPasswords({ current: '', new: '', confirm: '' });
      showToast('Password berhasil diubah!', 'success');
    } catch (err) {
      console.error('handleChangePassword error:', err);
      showToast('Terjadi kesalahan, coba lagi', 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const avatarUri =
    photoUri ||
    (user?.profile_picture
      ? `${API_URL}${user.profile_picture}`
      : DEFAULT_AVATAR);

  const pwdFields = [
    {
      key: 'current',
      label: 'Password Lama',
      icon: 'lock-outline',
      placeholder: 'Masukkan password lama',
    },
    {
      key: 'new',
      label: 'Password Baru',
      icon: 'lock-plus-outline',
      placeholder: 'Min. 6 karakter',
    },
    {
      key: 'confirm',
      label: 'Konfirmasi Baru',
      icon: 'lock-check-outline',
      placeholder: 'Ulangi password baru',
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Toast */}
      {toast && (
        <Toast key={toast.key} message={toast.message} type={toast.type} />
      )}

      {/* Header */}
      <LinearGradient
        colors={[C.secondary, '#2D4365']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: 48 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── AVATAR ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <TouchableOpacity style={styles.avatarEditBtn} onPress={pickPhoto}>
              <LinearGradient
                colors={[C.secondary, '#2D4365']}
                style={styles.avatarEditGradient}
              >
                <Icon name="camera" size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={[styles.avatarHint, { color: C.muted }]}>
            Ketuk foto untuk mengubah
          </Text>
          {photoUri && (
            <TouchableOpacity
              onPress={() => {
                setPhotoUri(null);
                setPhotoFile(null);
              }}
            >
              <Text style={{ color: C.danger, fontSize: 12, marginTop: 4 }}>
                Batalkan perubahan foto
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── INFORMASI PRIBADI ── */}
        <View style={[styles.card, { backgroundColor: card }]}>
          <Section
            icon="account-outline"
            title="Informasi Pribadi"
            isDark={isDark}
          />

          <Field
            label="Nama Lengkap"
            icon="account-outline"
            value={form.name}
            onChangeText={v => set('name', v)}
            placeholder="Nama kamu"
            isDark={isDark}
          />
          <Field
            label="Email"
            icon="email-outline"
            value={form.email}
            onChangeText={v => set('email', v)}
            placeholder="email@contoh.com"
            keyboardType="email-address"
            isDark={isDark}
          />
          <Field
            label="No. HP / WhatsApp"
            icon="phone-outline"
            value={form.phone}
            onChangeText={v => set('phone', v)}
            placeholder="08xxxxxxxxxx"
            keyboardType="phone-pad"
            isDark={isDark}
          />
        </View>

        {/* ── INFO PEMBAYARAN ── */}
        <View style={[styles.card, { backgroundColor: card }]}>
          <Section
            icon="credit-card-settings-outline"
            title="Info Pembayaran"
            isDark={isDark}
          />
          <Text style={[styles.cardHint, { color: C.muted }]}>
            Ditampilkan ke peserta saat mereka mau transfer ke kamu
          </Text>

          {/* Metode Pembayaran */}
          <Text
            style={[
              styles.fieldLabel,
              { color: isDark ? '#9ca3af' : C.muted, marginBottom: 8 },
            ]}
          >
            Metode Pembayaran
          </Text>
          <View style={styles.methodRow}>
            {PAYMENT_METHODS.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.methodBtn,
                  {
                    backgroundColor:
                      form.payment_method === m.key
                        ? isDark
                          ? '#4A70A9'
                          : '#4A70A9'
                        : isDark
                        ? C.darkInput
                        : C.lightInput,
                    borderColor:
                      form.payment_method === m.key
                        ? C.primary
                        : isDark
                        ? C.borderDark
                        : C.border,
                  },
                ]}
                onPress={() => set('payment_method', m.key)}
              >
                <Icon
                  name={m.icon}
                  size={18}
                  color={form.payment_method === m.key ? C.lightBg : C.muted}
                />
                <Text
                  style={[
                    styles.methodLabel,
                    {
                      color:
                        form.payment_method === m.key ? C.lightBg : C.muted,
                    },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field
            label={
              form.payment_method === 'e_wallet'
                ? 'Platform E-Wallet'
                : 'Nama Bank'
            }
            icon="bank-outline"
            value={form.bank_name}
            onChangeText={v => set('bank_name', v)}
            placeholder={
              form.payment_method === 'e_wallet'
                ? 'GoPay, OVO, Dana, dll'
                : 'BCA, Mandiri, BRI, dll'
            }
            isDark={isDark}
          />
          <Field
            label={
              form.payment_method === 'e_wallet'
                ? 'No. HP Terdaftar'
                : 'No. Rekening'
            }
            icon="credit-card-outline"
            value={form.payment_account}
            onChangeText={v => set('payment_account', v)}
            placeholder={
              form.payment_method === 'e_wallet' ? '08xxxxxxxxxx' : '1234567890'
            }
            keyboardType="phone-pad"
            isDark={isDark}
          />
          <Field
            label="Atas Nama"
            icon="account-card-outline"
            value={form.account_holder}
            onChangeText={v => set('account_holder', v)}
            placeholder="Nama pemilik rekening"
            isDark={isDark}
          />
        </View>

        {/* ── SAVE BUTTON ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={loading}
          style={{ marginHorizontal: 16 }}
        >
          <LinearGradient
            colors={[C.secondary, '#2D4365']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Icon name="content-save-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── GANTI PASSWORD ── */}
        <View style={[styles.card, { backgroundColor: card }]}>
          <Section icon="lock-reset" title="Ganti Password" isDark={isDark} />

          {pwdFields.map(f => (
            <Field
              key={f.key}
              label={f.label}
              icon={f.icon}
              value={passwords[f.key]}
              onChangeText={v => setPwd(f.key, v)}
              placeholder={f.placeholder}
              secureTextEntry={!showPwd[f.key]}
              isDark={isDark}
              rightElement={
                <TouchableOpacity
                  onPress={() =>
                    setShowPwd(s => ({ ...s, [f.key]: !s[f.key] }))
                  }
                >
                  <Icon
                    name={showPwd[f.key] ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={C.muted}
                  />
                </TouchableOpacity>
              }
            />
          ))}

          {/* Password strength indicator */}
          {passwords.new.length > 0 && (
            <View style={styles.strengthWrap}>
              {[1, 2, 3, 4].map(i => {
                const len = passwords.new.length;
                const filled =
                  len >= 6 ? (len >= 10 ? (len >= 14 ? 4 : 3) : 2) : 1;
                const color =
                  filled >= 4
                    ? '#059669'
                    : filled >= 3
                    ? C.primary
                    : filled >= 2
                    ? C.warning
                    : C.danger;
                return (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          i <= filled
                            ? color
                            : isDark
                            ? C.borderDark
                            : C.border,
                      },
                    ]}
                  />
                );
              })}
              <Text style={[styles.strengthLabel, { color: C.muted }]}>
                {passwords.new.length < 6
                  ? 'Terlalu pendek'
                  : passwords.new.length < 10
                  ? 'Lemah'
                  : passwords.new.length < 14
                  ? 'Kuat'
                  : 'Sangat kuat'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleChangePassword}
            disabled={pwdLoading}
          >
            <LinearGradient
              colors={[C.secondary, '#2D4365']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              {pwdLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name="lock-reset" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Ubah Password</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },

  scroll: { padding: 16, gap: 16 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: 8, gap: 6 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#4A70A9',
  },
  avatarEditBtn: { position: 'absolute', bottom: 0, right: 0 },
  avatarEditGradient: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarHint: { fontSize: 12 },

  // Card
  card: {
    borderRadius: 18,
    padding: 18,
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cardHint: { fontSize: 12, marginBottom: 8, marginTop: -4 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  sectionLine: { flex: 1, height: 1 },

  // Field
  fieldWrap: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldInput: { flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },

  // Payment method selector
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  methodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  methodLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },

  // Save button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Password strength
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    marginTop: -4,
  },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, minWidth: 70 },

  // Toast
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
});
