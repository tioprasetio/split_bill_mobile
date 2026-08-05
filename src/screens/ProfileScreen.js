// screens/ProfileScreen.js
// Versi bersih — hanya profil, payment info, health summary history, logout
import React, { useEffect, useState } from 'react';
import { API_URL } from '@env';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from '../contexts/DarkMode';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const COLORS = {
  primary: '#4A70A9',
  secondary: '#4A70A9',
  danger: '#CF262B',
  darkBg: '#111827',
  lightBg: '#f4f6f9',
  darkCard: '#1f2937',
  lightCard: '#ffffff',
  textDark: '#111827',
  textLight: '#f9fafb',
  textMuted: '#9ca3af',
  darkBorder: '#374151',
  lightBorder: '#e0e0e0',
};

const DEFAULT_AVATAR =
  'https://static.vecteezy.com/system/resources/previews/054/343/112/non_2x/a-person-icon-in-a-circle-free-png.png';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useDarkMode();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const bg = isDarkMode ? COLORS.darkBg : COLORS.lightBg;
  const card = isDarkMode ? COLORS.darkCard : COLORS.lightCard;
  const textPrimary = isDarkMode ? COLORS.textLight : COLORS.textDark;
  const border = isDarkMode ? COLORS.darkBorder : COLORS.lightBorder;

  useEffect(() => {
    if (user) setLoading(false);
    else navigation.replace('Login');
  }, [user, navigation]);

  useEffect(() => {
    if (user?.id) fetchSummaries();
  }, [user?.id]);

  const fetchSummaries = async () => {
    setSummaryLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/health-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : { data: [] };
      setSummaries(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Info rows untuk payment info
  const paymentRows = [
    {
      icon: 'bank-outline',
      label: 'Metode Pembayaran',
      value: user?.payment_method || '-',
    },
    {
      icon: 'credit-card-outline',
      label: 'Nama Bank / Dompet',
      value: user?.bank_name || '-',
    },
    {
      icon: 'account-card-outline',
      label: 'No. Rekening',
      value: user?.payment_account || '-',
    },
    {
      icon: 'account-outline',
      label: 'Atas Nama',
      value: user?.account_holder || '-',
    },
    { icon: 'phone-outline', label: 'No. HP', value: user?.phone || '-' },
  ];

  const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    headerGradient: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 32,
      alignItems: 'center',
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    headerTitle: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '600',
      alignSelf: 'flex-start',
      marginBottom: 16,
    },
    avatarWrap: { position: 'relative', marginBottom: 12 },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.5)',
    },
    editAvatarBtn: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: COLORS.secondary,
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#fff',
    },
    userName: {
      fontSize: 22,
      fontWeight: '800',
      color: '#fff',
      marginBottom: 4,
    },
    userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

    body: { padding: 16, gap: 14, marginTop: 0 },

    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
    },
    editBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    card: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    cardTitle: { fontSize: 15, fontWeight: '700' },
    cardHint: { fontSize: 12, marginBottom: 12 },
    divider: {
      height: 1,
      backgroundColor: isDarkMode ? '#374151' : '#e0e0e0',
      marginBottom: 8,
    },

    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
    },
    infoRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoLabel: { fontSize: 13 },
    infoValue: {
      fontSize: 13,
      fontWeight: '600',
      maxWidth: '55%',
      textAlign: 'right',
    },

    emptyBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    emptyText: { fontSize: 13 },

    summaryItem: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    summaryDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: COLORS.primary,
      marginTop: 5,
    },
    summaryTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    summaryDate: { fontSize: 11, marginBottom: 4 },
    summaryPreview: { fontSize: 12, lineHeight: 17 },

    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      gap: 12,
    },
    settingsLabel: { flex: 1, fontSize: 14, fontWeight: '500' },

    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
    },
    logoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    version: { textAlign: 'center', fontSize: 12, marginTop: 4 },
  });

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bg }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HEADER ── */}
      <LinearGradient
        colors={['#4A70A9', '#2D4365']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Profil Saya</Text>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <Image
            source={{
              uri: user?.profile_picture
                ? `${API_URL}${user.profile_picture}`
                : DEFAULT_AVATAR,
            }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatarBtn}>
            <Icon name="camera" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </LinearGradient>

      <View style={styles.body}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <LinearGradient
            colors={[COLORS.secondary, '#2D4365']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.editBtn}
          >
            <Icon name="account-edit-outline" size={18} color="#fff" />
            <Text style={styles.editBtnText}>Edit Profil</Text>
          </LinearGradient>
        </TouchableOpacity>
        {/* ── EDIT PROFILE BUTTON ── */}

        {/* ── PAYMENT INFO ── */}
        <View
          style={[styles.card, { backgroundColor: card, borderColor: border }]}
        >
          <View style={styles.cardHeader}>
            <Icon
              name="credit-card-settings-outline"
              size={18}
              color={COLORS.primary}
            />
            <Text style={[styles.cardTitle, { color: textPrimary }]}>
              Info Pembayaran
            </Text>
          </View>
          <Text style={[styles.cardHint, { color: COLORS.textMuted }]}>
            Ditampilkan ke peserta saat mereka mau transfer ke kamu
          </Text>

          <View style={styles.divider} />

          {paymentRows.map((row, i) => (
            <View
              key={i}
              style={[
                styles.infoRow,
                i < paymentRows.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: border,
                },
              ]}
            >
              <View style={styles.infoRowLeft}>
                <Icon name={row.icon} size={16} color={COLORS.textMuted} />
                <Text style={[styles.infoLabel, { color: COLORS.textMuted }]}>
                  {row.label}
                </Text>
              </View>
              <Text style={[styles.infoValue, { color: textPrimary }]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* ── HEALTH SUMMARY HISTORY ── */}
        <View
          style={[styles.card, { backgroundColor: card, borderColor: border }]}
        >
          <View style={styles.cardHeader}>
            <Icon
              name="chart-timeline-variant"
              size={18}
              color={COLORS.primary}
            />
            <Text style={[styles.cardTitle, { color: textPrimary }]}>
              Riwayat Ringkasan AI
            </Text>
          </View>

          {summaryLoading ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginVertical: 20 }}
            />
          ) : summaries.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon
                name="chart-box-outline"
                size={36}
                color={COLORS.textMuted}
              />
              <Text style={[styles.emptyText, { color: COLORS.textMuted }]}>
                Belum ada ringkasan mingguan
              </Text>
            </View>
          ) : (
            summaries.map((s, i) => (
              <View
                key={i}
                style={[styles.summaryItem, { borderBottomColor: border }]}
              >
                <View style={styles.summaryDot} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.summaryTitle, { color: textPrimary }]}>
                    {s.title}
                  </Text>
                  <Text
                    style={[styles.summaryDate, { color: COLORS.textMuted }]}
                  >
                    {new Date(s.startDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {' — '}
                    {new Date(s.endDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text
                    style={[styles.summaryPreview, { color: COLORS.textMuted }]}
                    numberOfLines={2}
                  >
                    {s.aiSummary}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── SETTINGS ROWS ── */}
        <View
          style={[styles.card, { backgroundColor: card, borderColor: border }]}
        >
          {[
            {
              icon: 'bug-outline',
              label: 'Laporkan Bug',
              onPress: () => navigation.navigate('BugScreen'),
            },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.settingsRow,
                i < arr.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: border,
                },
              ]}
              onPress={item.onPress}
            >
              <Icon name={item.icon} size={20} color={COLORS.textMuted} />
              <Text style={[styles.settingsLabel, { color: textPrimary }]}>
                {item.label}
              </Text>
              <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── LOGOUT ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert('Logout?', 'Yakin ingin keluar?', [
              { text: 'Batal', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: logout },
            ])
          }
        >
          <LinearGradient
            colors={[COLORS.danger, '#A11E22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoutBtn}
          >
            <Icon name="logout" size={18} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* App version */}
        <Text style={[styles.version, { color: COLORS.textMuted }]}>
          Snipio App v1.0.2
        </Text>

        <View style={{ height: 0 }} />
      </View>
    </ScrollView>
  );
}
