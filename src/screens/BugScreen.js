import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkMode';

const COLORS = {
  primary: '#4A70A9',
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

const FAQ = [
  {
    q: 'Bug saya tidak ada di daftar, gimana?',
    a: 'Ceritakan detail bug kamu lewat WhatsApp, kami akan segera menindaklanjuti.',
  },
  {
    q: 'Berapa lama bug diperbaiki?',
    a: 'Biasanya 1–3 hari kerja tergantung tingkat keparahan bug.',
  },
  {
    q: 'Apakah data saya aman?',
    a: 'Ya, laporan bug tidak mengakses data pribadi atau transaksi kamu.',
  },
];

export default function BugScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [openFaq, setOpenFaq] = React.useState(null);

  const bg = isDarkMode ? COLORS.darkBg : COLORS.lightBg;
  const card = isDarkMode ? COLORS.darkCard : COLORS.lightCard;
  const textPrimary = isDarkMode ? COLORS.textLight : COLORS.textDark;
  const border = isDarkMode ? COLORS.darkBorder : COLORS.lightBorder;

  const handleLaporBug = () => {
    const msg =
      `Halo, saya ingin melaporkan bug:\n\n` +
      `*Versi Aplikasi:* v1.0.0\n` +
      `*Pengguna:* ${user?.email}\n` +
      `*Tanggal:* ${new Date().toLocaleDateString('id-ID')}\n\n` +
      `*Deskripsi Bug:*\n[Tuliskan detail bug di sini]`;

    Linking.openURL(
      `whatsapp://send?phone=6289643726106&text=${encodeURIComponent(msg)}`,
    );
  };

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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerIconWrap}>
          <Icon name="bug-outline" size={36} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Laporkan Bug</Text>
        <Text style={styles.headerSub}>Bantu kami memperbaiki aplikasi</Text>
      </LinearGradient>

      <View style={styles.body}>
        {/* ── INFO CARD ── */}
        <View
          style={[styles.card, { backgroundColor: card, borderColor: border }]}
        >
          <View style={styles.cardHeader}>
            <Icon name="information-outline" size={17} color={COLORS.primary} />
            <Text style={[styles.cardTitle, { color: textPrimary }]}>
              Info Laporan
            </Text>
          </View>
          <Text style={[styles.cardHint, { color: COLORS.textMuted }]}>
            Info berikut otomatis disertakan agar tim kami bisa menindaklanjuti
            lebih cepat.
          </Text>

          {[
            {
              icon: 'cellphone',
              label: 'Versi Aplikasi',
              value: 'v1.0.0',
              iconBg: '#E6F1FB',
              iconColor: '#185FA5',
            },
            {
              icon: 'account-circle-outline',
              label: 'Pengguna',
              value: user?.email || '-',
              iconBg: '#EAF3DE',
              iconColor: '#3B6D11',
            },
            {
              icon: 'calendar-outline',
              label: 'Tanggal',
              value: new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
              iconBg: '#FAEEDA',
              iconColor: '#854F0B',
            },
          ].map((row, i, arr) => (
            <View
              key={i}
              style={[
                styles.infoRow,
                { borderBottomColor: border },
                i === arr.length - 1 && {
                  borderBottomWidth: 0,
                  marginBottom: 0,
                },
              ]}
            >
              <View style={[styles.infoIcon, { backgroundColor: row.iconBg }]}>
                <Icon name={row.icon} size={16} color={row.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: COLORS.textMuted }]}>
                  {row.label}
                </Text>
                <Text
                  style={[styles.infoValue, { color: textPrimary }]}
                  numberOfLines={1}
                >
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── NOTE ── */}
        <View
          style={[
            styles.noteBox,
            {
              backgroundColor: isDarkMode ? '#1a2e1a' : '#f0fdf4',
              borderColor: '#86efac',
            },
          ]}
        >
          <Icon
            name="lightbulb-outline"
            size={16}
            color="#16a34a"
            style={{ marginTop: 1 }}
          />
          <Text
            style={[
              styles.noteText,
              { color: isDarkMode ? '#86efac' : '#15803d' },
            ]}
          >
            Setelah tombol ditekan, WhatsApp akan terbuka dengan template pesan
            yang sudah terisi. Kamu tinggal mengisi bagian deskripsi bug-nya.
          </Text>
        </View>

        {/* ── WA BUTTON ── */}
        <TouchableOpacity activeOpacity={0.85} onPress={handleLaporBug}>
          <LinearGradient
            colors={['#25D366', '#128C7E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.waBtn}
          >
            <Icon name="whatsapp" size={22} color="#fff" />
            <Text style={styles.waBtnText}>Laporkan via WhatsApp</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── FAQ ── */}
        <View
          style={[styles.card, { backgroundColor: card, borderColor: border }]}
        >
          <View style={styles.cardHeader}>
            <Icon
              name="frequently-asked-questions"
              size={17}
              color={COLORS.primary}
            />
            <Text style={[styles.cardTitle, { color: textPrimary }]}>FAQ</Text>
          </View>
          {FAQ.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.faqItem, { borderTopColor: border }]}
              onPress={() => setOpenFaq(openFaq === i ? null : i)}
              activeOpacity={0.7}
            >
              <View style={styles.faqRow}>
                <Text style={[styles.faqQ, { color: textPrimary, flex: 1 }]}>
                  {item.q}
                </Text>
                <Icon
                  name={openFaq === i ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </View>
              {openFaq === i && (
                <Text style={[styles.faqA, { color: COLORS.textMuted }]}>
                  {item.a}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── VERSION ── */}
        <Text style={[styles.version, { color: COLORS.textMuted }]}>
          Snipio App v1.0.0
        </Text>

        <View style={{ height: 24 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 4,
  },
  headerIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

  body: { padding: 16, gap: 12 },

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
    marginBottom: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardHint: { fontSize: 12, marginBottom: 14, lineHeight: 18 },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 2,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: 11, marginBottom: 1 },
  infoValue: { fontSize: 13, fontWeight: '600' },

  noteBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },

  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  waBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  faqItem: { paddingVertical: 12, borderTopWidth: 1 },
  faqRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  faqQ: { fontSize: 13, fontWeight: '600' },
  faqA: { fontSize: 12, lineHeight: 18, marginTop: 6 },

  version: { textAlign: 'center', fontSize: 12, marginTop: 4 },
});
