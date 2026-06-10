import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useDarkMode } from '../contexts/DarkMode';

// 🔥 KONSTANTA DI LUAR KOMPONEN (biar gak re-render)
const COLORS = {
  primary: '#4A70A9',
  secondary: '#2D4365',
  danger: '#ff6b6b',
  success: '#4CAF50',
  warning: '#FF9800',
  darkBg: '#111827',
  lightBg: '#f4f6f9',
  darkCard: '#404040',
  lightCard: '#fff',
};

// ─── HELPER: hitung warna skor ─────────────────────────────────────────────
const getScoreColor = score => {
  if (score >= 80) return '#4CAF50';
  if (score >= 60) return '#FF9800';
  if (score >= 40) return '#FF5722';
  return '#f44336';
};

// ─── HELPER: group daftar_item (flat) by toko ──────────────────────────────
const groupItemsByToko = (daftarItem = []) => {
  const grouped = {};
  daftarItem.forEach(item => {
    if (!grouped[item.toko]) grouped[item.toko] = [];
    grouped[item.toko].push(item);
  });
  return Object.entries(grouped).map(([toko, items]) => ({ toko, items }));
};

const SummaryPage = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null);

  const fetchSummaries = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/health-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        setSummaries(result.data || []);
        if (result.data?.length > 0) setSelectedSummary(result.data[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal mengambil data summary');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const generateNewSummary = useCallback(async () => {
    try {
      setGenerating(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/health-summary/daily`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (response.ok) {
        Alert.alert('Sukses', 'Analisis berhasil dibuat!');
        await fetchSummaries();
      } else if (result.error?.includes('udah pernah')) {
        Alert.alert('Info', 'Summary hari ini sudah pernah dibuat');
        await fetchSummaries();
      } else {
        Alert.alert('Error', result.error || 'Gagal generate summary');
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal terhubung ke server');
    } finally {
      setGenerating(false);
    }
  }, [fetchSummaries]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSummaries();
  }, [fetchSummaries]);

  const getBgColor = (light, dark) => (isDarkMode ? dark : light);

  const structured = selectedSummary?.rawData?.structured;
  const ringkasan = selectedSummary?.rawData?.transactions?.ringkasan;
  const groupedReceipts = groupItemsByToko(
    selectedSummary?.rawData?.transactions?.daftar_item,
  );

  const dynamicStyles = {
    receiptCard: {
      backgroundColor: getBgColor('#f8f9fa', '#111827'),
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: getBgColor('#e0e0e0', '#161F31'),
    },
    storeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: getBgColor('#e0e0e0', '#404040'),
    },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getBgColor('#ffffff', '#1f2937'),
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      marginVertical: 2,
      borderWidth: 1,
      borderColor: getBgColor('#f0f0f0', '#333'),
    },
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: getBgColor(COLORS.lightBg, COLORS.darkBg) },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text
          style={[
            styles.loadingText,
            { color: getBgColor('#353535', '#f0f0f0') },
          ]}
        >
          Memuat data...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: getBgColor(COLORS.lightBg, COLORS.darkBg) },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon
            name="arrow-left"
            size={24}
            color={getBgColor('#353535', '#f0f0f0')}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            { color: getBgColor('#353535', '#f0f0f0') },
          ]}
        >
          Analisis Pola Konsumsi
        </Text>

        <TouchableOpacity onPress={generateNewSummary} disabled={generating}>
          {generating ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Icon
              name="refresh"
              size={24}
              color={getBgColor('#353535', '#f0f0f0')}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {summaries.length === 0 ? (
          <View
            style={[
              styles.emptyContainer,
              { backgroundColor: getBgColor('#fff', '#1f2937') },
            ]}
          >
            <Icon name="food-off" size={64} color="#999" />
            <Text
              style={[
                styles.emptyTitle,
                { color: getBgColor('#353535', '#f0f0f0') },
              ]}
            >
              Belum Ada Analisis
            </Text>
            <Text style={styles.emptyText}>
              Generate analisis pertama kamu untuk melihat pola konsumsi minggu
              ini
            </Text>

            <TouchableOpacity
              style={styles.generateBigButton}
              onPress={generateNewSummary}
              disabled={generating}
            >
              <LinearGradient
                colors={
                  generating
                    ? ['#999', '#666']
                    : [COLORS.primary, COLORS.secondary]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.generateButtonGradient}
              >
                {generating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.generateBigButtonText}>
                    Generate Analisis Sekarang
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Period Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.periodScroll}
              nestedScrollEnabled={true}
            >
              {summaries.map(summary => (
                <TouchableOpacity
                  key={summary.id}
                  onPress={() => setSelectedSummary(summary)}
                  style={{ marginRight: 8 }}
                >
                  <LinearGradient
                    colors={
                      selectedSummary?.id === summary.id
                        ? [COLORS.primary, COLORS.secondary]
                        : isDarkMode
                        ? ['#1f2937', '#111827']
                        : ['#fff', '#f0f0f0']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.periodChip}
                  >
                    <Text
                      style={[
                        styles.periodChipText,
                        {
                          color:
                            selectedSummary?.id === summary.id
                              ? '#fff'
                              : getBgColor('#353535', '#f0f0f0'),
                        },
                      ]}
                    >
                      {summary.title}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Detail Summary */}
            {selectedSummary && (
              <View
                style={[
                  styles.detailCard,
                  { backgroundColor: getBgColor('#fff', '#1f2937') },
                ]}
              >
                {/* ── 1. HEADLINE ─────────────────────────────────────────── */}
                <View style={styles.aiSection}>
                  <View style={styles.sectionHeader}>
                    <Icon name="robot" size={24} color={COLORS.primary} />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: getBgColor('#353535', '#f0f0f0') },
                      ]}
                    >
                      Ringkasan Hari Ini
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.aiSummary,
                      { color: getBgColor('#353535', '#f0f0f0') },
                    ]}
                  >
                    {selectedSummary.aiSummary || 'Tidak ada ringkasan'}
                  </Text>
                </View>

                {/* ── 2. SKOR KESEHATAN ────────────────────────────── */}
                {structured?.score !== undefined && (
                  <View
                    style={[
                      styles.scoreCard,
                      { backgroundColor: getBgColor('#f0f8ff', '#0d1a2e') },
                    ]}
                  >
                    <View style={styles.scoreInner}>
                      {/* Kiri: label + progress bar */}
                      <View style={{ flex: 1 }}>
                        <View style={styles.scoreHeaderRow}>
                          <Icon
                            name="heart-pulse"
                            size={14}
                            color={getScoreColor(structured.score)}
                          />
                          <Text
                            style={[
                              styles.scoreTitleSmall,
                              { color: getBgColor('#666', '#9ab') },
                            ]}
                          >
                            Skor Kesehatan Hari Ini
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.progressTrack,
                            {
                              backgroundColor: getBgColor(
                                'rgba(0,0,0,0.07)',
                                'rgba(255,255,255,0.1)',
                              ),
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${structured.score}%`,
                                backgroundColor: getScoreColor(
                                  structured.score,
                                ),
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.scoreLabelNew,
                            { color: getScoreColor(structured.score) },
                          ]}
                        >
                          {structured.scoreLabel}
                        </Text>
                      </View>

                      {/* Kanan: angka bulat */}
                      <View
                        style={[
                          styles.scoreBadge,
                          { borderColor: getScoreColor(structured.score) },
                        ]}
                      >
                        <Text
                          style={[
                            styles.scoreBigNumber,
                            { color: getScoreColor(structured.score) },
                          ]}
                        >
                          {structured.score}
                        </Text>
                        <Text
                          style={[
                            styles.scoreOutOf,
                            { color: getBgColor('#bbb', '#666') },
                          ]}
                        >
                          /100
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* ── 3. STATS ─────────────────────────────────────────────── */}
                <View style={styles.statsGrid}>
                  <View
                    style={[
                      styles.statCard,
                      { backgroundColor: getBgColor('#f0f8ff', '#111827') },
                    ]}
                  >
                    <Icon name="receipt" size={32} color={COLORS.primary} />
                    <Text
                      style={[
                        styles.statNumber,
                        { color: getBgColor('#353535', '#f0f0f0') },
                      ]}
                    >
                      {ringkasan?.jumlah_transaksi ?? 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: '#999' }]}>
                      Transaksi
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statCard,
                      { backgroundColor: getBgColor('#fff0f0', '#111827') },
                    ]}
                  >
                    <Icon name="food" size={32} color={COLORS.danger} />
                    <Text
                      style={[
                        styles.statNumber,
                        { color: getBgColor('#353535', '#f0f0f0') },
                      ]}
                    >
                      {ringkasan?.total_item ?? 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: '#999' }]}>
                      Total Item
                    </Text>
                  </View>
                </View>

                {/* ── 4. INSIGHTS ──────────────────────────────────── */}
                {structured?.insights?.length > 0 && (
                  <View style={styles.blockSection}>
                    <View style={styles.sectionHeader}>
                      <Icon name="magnify" size={18} color={COLORS.primary} />
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: getBgColor('#353535', '#f0f0f0') },
                        ]}
                      >
                        Insight
                      </Text>
                    </View>
                    {structured.insights.map((insight, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.insightRow,
                          { backgroundColor: getBgColor('#eef3ff', '#0d1b2e') },
                        ]}
                      >
                        <View style={styles.insightAccent} />
                        <Text
                          style={[
                            styles.insightText,
                            { color: getBgColor('#353535', '#e0e0e0') },
                          ]}
                        >
                          {insight}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* ── 5. APRESIASI POSITIF ─────────────────────────── */}
                {structured?.positif &&
                  structured.positif.toLowerCase() !== 'null' && (
                    <LinearGradient
                      colors={
                        isDarkMode
                          ? ['#0d2b18', '#1a4a2e']
                          : ['#e8f5e9', '#c8e6c9']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.positifBanner}
                    >
                      <Icon
                        name="star-circle"
                        size={30}
                        color={isDarkMode ? '#66bb6a' : '#2e7d32'}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                          style={[
                            styles.positifLabel,
                            { color: isDarkMode ? '#a5d6a7' : '#1b5e20' },
                          ]}
                        >
                          Apresiasi ✨
                        </Text>
                        <Text
                          style={[
                            styles.positifMsg,
                            { color: isDarkMode ? '#c8e6c9' : '#2e7d32' },
                          ]}
                        >
                          {structured.positif}
                        </Text>
                      </View>
                    </LinearGradient>
                  )}

                {/* ── 6. REKOMENDASI ───────────────────────────────── */}
                {structured?.rekomendasi?.length > 0 && (
                  <View style={styles.blockSection}>
                    <View style={styles.sectionHeader}>
                      <Icon
                        name="lightbulb-on-outline"
                        size={18}
                        color="#FF9800"
                      />
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: getBgColor('#353535', '#f0f0f0') },
                        ]}
                      >
                        Rekomendasi
                      </Text>
                    </View>
                    {structured.rekomendasi.map((saran, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.rekRow,
                          { backgroundColor: getBgColor('#fffbf2', '#1c1500') },
                        ]}
                      >
                        <View style={styles.rekNumBadge}>
                          <Text style={styles.rekNumText}>{idx + 1}</Text>
                        </View>
                        <Text
                          style={[
                            styles.rekText,
                            { color: getBgColor('#353535', '#f0f0f0') },
                          ]}
                        >
                          {saran}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* ── 7. TIPS BESOK ────────────────────────────────── */}
                {structured?.tipsBesok && (
                  <LinearGradient
                    colors={['#1e3a5f', '#4A70A9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tomorrowCard}
                  >
                    <View style={styles.tomorrowHeader}>
                      <Icon
                        name="weather-sunset-up"
                        size={18}
                        color="rgba(255,255,255,0.7)"
                      />
                      <Text style={styles.tomorrowLabel}>Tips untuk Besok</Text>
                    </View>
                    <Text style={styles.tomorrowText}>
                      {structured.tipsBesok}
                    </Text>
                  </LinearGradient>
                )}

                {/* ── 8. DAFTAR ITEM ───────────────────────────────── */}
                <View style={styles.itemsSection}>
                  <Text
                    style={[
                      styles.sectionSubtitle,
                      { color: getBgColor('#353535', '#f0f0f0') },
                    ]}
                  >
                    Item yang Dibeli Hari Ini:
                  </Text>

                  {groupedReceipts.map((receipt, idx) => (
                    <View key={idx} style={dynamicStyles.receiptCard}>
                      <View style={dynamicStyles.storeHeader}>
                        <Icon name="store" size={18} color={COLORS.primary} />
                        <Text
                          style={[
                            styles.storeName,
                            { color: getBgColor('#4A70A9', '#6396E2') },
                          ]}
                        >
                          {receipt.toko}
                        </Text>
                      </View>
                      <View style={styles.itemsContainer}>
                        {receipt.items.map((item, itemIdx) => (
                          <View key={itemIdx} style={dynamicStyles.itemCard}>
                            <Text
                              style={[
                                styles.itemName,
                                { color: getBgColor('#353535', '#f0f0f0') },
                              ]}
                            >
                              {item.nama} ({' '}
                              <Text
                                style={[
                                  styles.itemQty,
                                  { color: getBgColor('#4A70A9', '#6396E2') },
                                ]}
                              >
                                {item.jumlah}x
                              </Text>{' '}
                              )
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                <Text style={styles.footerNote}>
                  * Analisis dibuat sekali per hari berdasarkan transaksi
                  terbaru
                </Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 0 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyContainer: {
    margin: 16,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  generateBigButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  generateButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  generateBigButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  periodScroll: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  periodChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  aiSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  aiSummary: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  itemsSection: {
    marginBottom: 16,
  },
  itemsContainer: {
    gap: 6,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemName: {
    fontSize: 14,
    flex: 1,
  },
  itemQty: {
    fontWeight: 'bold',
    color: '#4A70A9',
  },
  footerNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },

  // ── Score Card ──────────────────────────────────────────────────────────
  scoreCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  scoreInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  scoreTitleSmall: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressTrack: {
    height: 10,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  scoreLabelNew: {
    fontSize: 12,
    fontWeight: '600',
  },
  scoreBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scoreBigNumber: {
    fontSize: 26,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  scoreOutOf: {
    fontSize: 11,
    fontWeight: '500',
  },

  // ── Insight ─────────────────────────────────────────────────────────────
  blockSection: {
    marginBottom: 20,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 10,
  },
  insightAccent: {
    width: 3,
    borderRadius: 4,
    alignSelf: 'stretch',
    backgroundColor: '#4A70A9',
    flexShrink: 0,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },

  // ── Positif ─────────────────────────────────────────────────────────────
  positifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  positifLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  positifMsg: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },

  // ── Rekomendasi ─────────────────────────────────────────────────────────
  rekRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 10,
  },
  rekNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  rekNumText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  rekText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },

  // ── Tips Besok ──────────────────────────────────────────────────────────
  tomorrowCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  tomorrowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tomorrowLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tomorrowText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
});

export default SummaryPage;
