// screens/TagihanScreen.js
import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useDarkMode } from '../contexts/DarkMode';
import MyBills from '../components/MyBills';

const COLORS = {
  primary: '#4A70A9',
  darkBg: '#111827',
  lightBg: '#f4f6f9',
  darkCard: '#1f2937',
  lightCard: '#ffffff',
  textDark: '#111827',
  textLight: '#f9fafb',
  textMuted: '#9ca3af',
};

export default function TagihanScreen() {
  const { isDarkMode } = useDarkMode();

  const refreshRef = useRef(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const bg = isDarkMode ? COLORS.darkBg : COLORS.lightBg;
  const card = isDarkMode ? COLORS.darkCard : COLORS.lightCard;
  const textPrimary = isDarkMode ? COLORS.textLight : COLORS.textDark;

  const onRefresh = async () => {
    setRefreshing(true);
    if (refreshRef.current) {
      await refreshRef.current(); // panggil fetchMyBills dari MyBills
    }
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* ── HEADER — sama persis dengan SplitBillScreen ── */}
      <View style={[styles.header, { backgroundColor: card }]}>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>
          Tagihan Saya
        </Text>
        <Text style={[styles.headerSub, { color: COLORS.textMuted }]}>
          Tagihan split bill yang perlu kamu bayar
        </Text>
      </View>

      {/* ── CONTENT dengan RefreshControl ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* MyBills menerima refreshRef agar TagihanScreen bisa trigger refresh */}
        <MyBills refreshRef={refreshRef} />
        <View style={{ height: 0 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 4 },
  content: { padding: 16 },
});
