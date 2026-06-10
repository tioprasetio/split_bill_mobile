import React, { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@env';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from '../contexts/DarkMode';
import { useAuth } from '../contexts/AuthContext';
import HealthSummaryCard from '../components/HealthSummaryCard';
import HealthAlertModal from '../components/HealthAlertModal';

const COLORS = {
  primary: '#4A70A9',
  activity: '#28A154',
  secondary: '#4A70A9',
  danger: '#CF262B',
  warning: '#d97706',
  darkBg: '#111827',
  lightBg: '#f4f6f9',
  darkCard: '#1f2937',
  lightCard: '#ffffff',
  textDark: '#111827',
  textLight: '#f9fafb',
  textMuted: '#9ca3af',
};

const fmt = n => `Rp${Number(n || 0).toLocaleString('id-ID')}`;

export default function HomeScreen() {
  const { isDarkMode, setIsDarkMode } = useDarkMode();
  const { user } = useAuth();
  const navigation = useNavigation();

  const [healthAlerts, setHealthAlerts] = useState([]);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    totalTagihan: 0, // total yg harus dibayar user (sebagai participant)
    jumlahTagihan: 0,
    menantiKonfirmasi: 0, // bill yg sudah user upload bukti tapi belum dikonfirmasi lender
    totalDitanggung: 0, // total yg harus dibayar orang lain ke user (sebagai lender)
    pendingKonfirmasi: 0, // orang yg sudah upload bukti, menunggu konfirmasi user
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [token, setToken] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken);
  }, []);

  useEffect(() => {
    if (token && user?.id) {
      fetchDashboardData();
      checkHealthAlerts();
    }
  }, [token, user?.id, fetchDashboardData, checkHealthAlerts]);

  const fetchDashboardData = useCallback(async () => {
    if (!token || !user?.id) return;
    try {
      // Fetch tagihan saya (sebagai participant)
      const billsRes = await fetch(`${API_URL}/api/my-bills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const billsData = billsRes.ok ? await billsRes.json() : [];

      // Fetch receipts saya (sebagai lender)
      const receiptsRes = await fetch(`${API_URL}/api/receipts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const receiptsData = receiptsRes.ok ? await receiptsRes.json() : [];

      // Hitung summary tagihan
      const myBills = billsData.filter(b => b.status !== 'CONFIRMED');
      const totalTagihan = myBills.reduce((s, b) => s + b.amount, 0);
      const menantiKonfirmasi = myBills.filter(b => b.status === 'PAID').length;

      // Hitung dari sisi lender
      const myReceipts = receiptsData.filter(r => r.userId === user.id);
      const allSplits = myReceipts.flatMap(r => r.billSplits || []);
      const pendingKonfirmasi = allSplits.filter(
        s => s.status === 'PAID',
      ).length;
      const totalDitanggung = allSplits
        .filter(s => s.status !== 'CONFIRMED')
        .reduce((s, b) => s + b.amount, 0);

      setSummary({
        totalTagihan,
        jumlahTagihan: myBills.length,
        menantiKonfirmasi,
        totalDitanggung,
        pendingKonfirmasi,
      });

      // Recent activity: gabungin bills + receipts, sort by id desc, ambil 4
      const recentBills = myBills.map(b => ({
        id: `bill-${b.receiptId}`,
        type: 'bill',
        title: b.receiptName,
        subtitle: `dari ${b.lender?.name || 'Lender'}`,
        amount: b.amount,
        status: b.status,
        createdAt: b.createdAt,
      }));

      const recentReceipts = myReceipts.map(r => {
        const subtotal =
          r.items?.reduce((s, i) => {
            const effectivePrice = i.price - (i.voucher || 0);
            return s + effectivePrice * i.qty;
          }, 0) || 0;

        const taxAmount = Math.round((subtotal * (r.taxPercent || 0)) / 100);
        const total = subtotal + taxAmount;

        return {
          id: `receipt-${r.id}`,
          type: 'receipt',
          title: r.name,
          subtitle: `${r.billSplits?.length || 0} peserta`,
          amount: total, // ← sebelumnya pakai kalkulasi salah
          status: 'lender',
          createdAt: r.extractedAt,
        };
      });

      const combined = [...recentBills, ...recentReceipts]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4);

      setRecentActivity(combined);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.id]);

  const checkHealthAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/health-alerts/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : { hasAlerts: false };

      console.log('📊 Health alerts response:', JSON.stringify(data)); // ← CEK INI

      if (data.hasAlerts) {
        setHealthAlerts(data.alerts);
        setShowAlertModal(true);
      }
    } catch (err) {
      console.error('Error checking health alerts:', err);
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const bg = isDarkMode ? COLORS.darkBg : COLORS.lightBg;
  const card = isDarkMode ? COLORS.darkCard : COLORS.lightCard;
  const textPrimary = isDarkMode ? COLORS.textLight : COLORS.textDark;
  const textMuted = COLORS.textMuted;
  const borderColor = isDarkMode ? '#374151' : '#f3f4f6';

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <HealthAlertModal
        visible={showAlertModal}
        alerts={healthAlerts}
        onClose={() => setShowAlertModal(false)}
        isDarkMode={isDarkMode}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: bg }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <LinearGradient
          colors={['#4A70A9', '#2D4365']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>Halo, 👋</Text>
              <Text style={styles.headerName}>{user?.name || 'Pengguna'}</Text>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <TouchableOpacity
                onPress={() => setIsDarkMode(prev => !prev)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.3)', // 🔥 BIAR KELIATAN
                  padding: 10,
                  borderRadius: 12,
                }}
              >
                <Icon
                  name={isDarkMode ? 'weather-night' : 'white-balance-sunny'}
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={() => navigation.navigate('Profil')}
              >
                <Image
                  source={{
                    uri: user?.profile_picture
                      ? `${API_URL}${user.profile_picture}`
                      : 'https://static.vecteezy.com/system/resources/previews/054/343/112/non_2x/a-person-icon-in-a-circle-free-png.png',
                  }}
                  style={styles.avatar}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Total tagihan highlight */}
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Total Tagihan Belum Bayar</Text>
            <Text style={styles.heroAmount}>{fmt(summary.totalTagihan)}</Text>
            <Text style={styles.heroSub}>
              {summary.jumlahTagihan} tagihan aktif
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ── QUICK STATS ROW ── */}
          <View style={styles.statsRow}>
            {/* Menanti konfirmasi lender */}
            <View style={[styles.statCard, { backgroundColor: card }]}>
              <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                <Icon name="timer-sand" size={20} color={COLORS.warning} />
              </View>
              <Text style={[styles.statValue, { color: textPrimary }]}>
                {summary.menantiKonfirmasi}
              </Text>
              <Text style={[styles.statLabel, { color: textMuted }]}>
                Menunggu{'\n'}Konfirmasi
              </Text>
            </View>

            {/* Piutang (orang yang belum bayar ke kamu) */}
            <View style={[styles.statCard, { backgroundColor: card }]}>
              <View style={[styles.statIcon, { backgroundColor: '#F0F2FD' }]}>
                <Icon name="cash-multiple" size={20} color={COLORS.primary} />
              </View>
              <Text
                style={[styles.statValue, { color: textPrimary, fontSize: 13 }]}
              >
                {fmt(summary.totalDitanggung)}
              </Text>
              <Text style={[styles.statLabel, { color: textMuted }]}>
                Piutang{'\n'}Aktif
              </Text>
            </View>
          </View>

          {/* ── QUICK ACTIONS ── */}
          <View style={[styles.section, { backgroundColor: card }]}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>
              Aksi Cepat
            </Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => navigation.navigate('SplitBill')}
              >
                <LinearGradient
                  colors={['#4A70A9', '#2D4365']}
                  style={styles.quickBtnGradient}
                >
                  <Icon
                    name="credit-card-scan-outline"
                    size={24}
                    color="#fff"
                  />
                </LinearGradient>
                <Text style={[styles.quickBtnLabel, { color: textPrimary }]}>
                  Split Baru
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => navigation.navigate('Tagihan')}
              >
                <LinearGradient
                  colors={['#4A70A9', '#2D4365']}
                  style={styles.quickBtnGradient}
                >
                  <Icon name="cash-multiple" size={24} color="#fff" />
                </LinearGradient>
                <Text style={[styles.quickBtnLabel, { color: textPrimary }]}>
                  Tagihan Saya
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => navigation.navigate('SplitBill')}
              >
                <LinearGradient
                  colors={['#4A70A9', '#2D4365']}
                  style={styles.quickBtnGradient}
                >
                  <Icon name="check-decagram-outline" size={24} color="#fff" />
                </LinearGradient>
                <Text style={[styles.quickBtnLabel, { color: textPrimary }]}>
                  Konfirmasi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => navigation.navigate('Profil')}
              >
                <LinearGradient
                  colors={['#4A70A9', '#2D4365']}
                  style={styles.quickBtnGradient}
                >
                  <Icon name="account-edit-outline" size={24} color="#fff" />
                </LinearGradient>
                <Text style={[styles.quickBtnLabel, { color: textPrimary }]}>
                  Profil
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── ALERT: PERLU KONFIRMASI ── */}
          {summary.pendingKonfirmasi > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('SplitBill')}
              activeOpacity={0.85}
            >
              <View style={styles.alertCard}>
                <Icon name="bell-ring" size={20} color="#92400e" />
                <Text style={styles.alertText}>
                  Ada{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {summary.pendingKonfirmasi} pembayaran
                  </Text>{' '}
                  yang menunggu konfirmasi kamu!
                </Text>
                <Icon name="chevron-right" size={18} color="#92400e" />
              </View>
            </TouchableOpacity>
          )}

          {/* ── RECENT ACTIVITY ── */}
          {recentActivity.length > 0 && (
            <View style={[styles.section, { backgroundColor: card }]}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                Aktivitas Terbaru
              </Text>
              {recentActivity.map(item => (
                <View
                  key={item.id}
                  style={[
                    styles.activityItem,
                    { borderBottomColor: borderColor },
                  ]}
                >
                  <View
                    style={[
                      styles.activityIcon,
                      {
                        backgroundColor:
                          item.type === 'bill' ? '#fee2e2' : '#d1fae5',
                      },
                    ]}
                  >
                    <Icon
                      name={
                        item.type === 'bill'
                          ? 'arrow-down-circle-outline'
                          : 'arrow-up-circle-outline'
                      }
                      size={18}
                      color={
                        item.type === 'bill' ? COLORS.danger : COLORS.activity
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.activityTitle, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={[styles.activitySub, { color: textMuted }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={[
                        styles.activityAmount,
                        {
                          color:
                            item.type === 'bill'
                              ? COLORS.danger
                              : COLORS.primary,
                        },
                      ]}
                    >
                      {item.type === 'bill' ? '-' : '+'}
                      {fmt(item.amount)}
                    </Text>
                    <StatusPill status={item.status} />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── HEALTH SUMMARY ── */}
          <HealthSummaryCard userId={user?.id} isDarkMode={isDarkMode} />

          <View style={{ height: 0 }} />
        </View>
      </ScrollView>
    </>
  );
}

const StatusPill = ({ status }) => {
  const cfg = {
    UNPAID: { label: 'Belum Bayar', bg: '#fee2e2', text: '#dc2626' },
    PAID: { label: 'Menunggu', bg: '#fef3c7', text: '#d97706' },
    CONFIRMED: { label: 'Lunas', bg: '#d1fae5', text: '#059669' },
    lender: { label: 'Lender', bg: '#eff6ff', text: '#2563eb' },
  }[status] || { label: status, bg: '#f3f4f6', text: '#6b7280' };

  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.pillText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  headerName: { fontSize: 22, color: '#fff', fontWeight: '700', marginTop: 2 },
  avatarBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },

  // Hero card
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  heroAmount: {
    fontSize: 30,
    color: '#fff',
    fontWeight: '800',
    marginVertical: 4,
  },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  body: { padding: 16, gap: 14 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, textAlign: 'center', lineHeight: 15 },

  // Section
  section: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },

  // Quick actions
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickBtn: { alignItems: 'center', gap: 8, flex: 1 },
  quickBtnGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Alert
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#d97706',
  },
  alertText: { flex: 1, fontSize: 13, color: '#92400e' },

  // Activity
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: { fontSize: 14, fontWeight: '600' },
  activitySub: { fontSize: 12, marginTop: 2 },
  activityAmount: { fontSize: 13, fontWeight: '700' },

  // Pill
  pill: {
    borderRadius: 100,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 3,
  },
  pillText: { fontSize: 9, fontWeight: '700' },
});
