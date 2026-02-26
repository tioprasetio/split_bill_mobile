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
  darkBg: '#140C00',
  lightBg: '#f4f6f9',
  darkCard: '#404040',
  lightCard: '#fff',
};

const SummaryPage = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null);

  // 🔥 PAKE useCallback biar function gak re-create terus
  const fetchSummaries = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/health-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (response.ok) {
        setSummaries(result.data || []);
        if (result.data?.length > 0) {
          setSelectedSummary(result.data[0]);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal mengambil data summary');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // 🔥 dependensi kosong karena API_URL dari env

  const generateNewSummary = useCallback(async () => {
    try {
      setGenerating(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/health-summary/weekly`, {
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
        Alert.alert('Info', 'Summary minggu ini sudah pernah dibuat');
        await fetchSummaries();
      } else {
        Alert.alert('Error', result.error || 'Gagal generate summary');
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal terhubung ke server');
    } finally {
      setGenerating(false);
    }
  }, [fetchSummaries]); // 🔥 dependensi fetchSummaries

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSummaries();
  }, [fetchSummaries]);

  const getBgColor = (light, dark) => (isDarkMode ? dark : light);

  const dynamicStyles = {
    receiptCard: {
      backgroundColor: getBgColor('#f8f9fa', '#2a2a2a'),
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: getBgColor('#e0e0e0', '#404040'),
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
      backgroundColor: getBgColor('#ffffff', '#1a1a1a'),
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
              { backgroundColor: getBgColor('#fff', '#404040') },
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
                        ? [COLORS.primary, COLORS.secondary] // Active: primary ke secondary
                        : isDarkMode
                        ? ['#404040', '#2a2a2a'] // Dark mode: dark gradient
                        : ['#fff', '#f0f0f0'] // Light mode: light gradient
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
                  { backgroundColor: getBgColor('#fff', '#404040') },
                ]}
              >
                {/* AI Summary */}
                <View style={styles.aiSection}>
                  <View style={styles.sectionHeader}>
                    <Icon name="robot" size={24} color={COLORS.primary} />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: getBgColor('#353535', '#f0f0f0') },
                      ]}
                    >
                      Ringkasan
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

                {/* Stats */}
                <View style={styles.statsGrid}>
                  <View
                    style={[
                      styles.statCard,
                      { backgroundColor: getBgColor('#f0f8ff', '#2a2a2a') },
                    ]}
                  >
                    <Icon name="receipt" size={32} color={COLORS.primary} />
                    <Text style={styles.statNumber}>
                      {selectedSummary.rawData?.length || 0}
                    </Text>
                    <Text style={styles.statLabel}>Transaksi</Text>
                  </View>

                  <View
                    style={[
                      styles.statCard,
                      { backgroundColor: getBgColor('#fff0f0', '#2a2a2a') },
                    ]}
                  >
                    <Icon name="food" size={32} color={COLORS.danger} />
                    <Text style={styles.statNumber}>
                      {selectedSummary.rawData?.reduce(
                        (sum, r) => sum + (r.items?.length || 0),
                        0,
                      ) || 0}
                    </Text>
                    <Text style={styles.statLabel}>Total Item</Text>
                  </View>
                </View>

                {/* Items List */}
                <View style={styles.itemsSection}>
                  <Text
                    style={[
                      styles.sectionSubtitle,
                      { color: getBgColor('#353535', '#f0f0f0') },
                    ]}
                  >
                    Makanan & Minuman Minggu Ini:
                  </Text>

                  {selectedSummary.rawData?.map((receipt, idx) => (
                    <View key={idx} style={dynamicStyles.receiptCard}>
                      <View style={dynamicStyles.storeHeader}>
                        <Icon name="store" size={18} color={COLORS.primary} />
                        <Text style={styles.storeName}>{receipt.toko}</Text>
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
                              {item.nama} (
                              <Text style={styles.itemQty}>{item.jumlah}x</Text>
                              )
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                <Text style={styles.footerNote}>
                  * Kamu bisa meminta analisis baru di hari Senin berikutnya
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 20 }} />
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
    color: '#4A70A9',
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
});

export default SummaryPage;
