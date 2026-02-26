// components/HealthSummaryCard.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const HealthSummaryCard = ({ userId, isDarkMode }) => {
  const navigation = useNavigation();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingLatest, setFetchingLatest] = useState(true);

  const generateSummary = async () => {
    try {
      setLoading(true);
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
        setSummary(result.data?.aiSummary || 'Analisis berhasil dibuat');
        Alert.alert('Sukses', 'Analisis pola konsumsi berhasil dibuat!');
      } else {
        if (result.error?.includes('udah pernah')) {
          Alert.alert('Info', 'Summary minggu ini sudah pernah dibuat');
          fetchLatestSummary();
        } else {
          Alert.alert('Error', result.error || 'Gagal generate summary');
        }
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      Alert.alert('Error', 'Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestSummary = async () => {
    try {
      setFetchingLatest(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/health-summary/latest`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (response.ok && result.data) {
        setSummary(result.data.aiSummary);
      }
    } catch (err) {
      console.error('Error fetching latest summary:', err);
    } finally {
      setFetchingLatest(false);
    }
  };

  // Cek apakah udah ada summary minggu ini
  useEffect(() => {
    if (userId) {
      fetchLatestSummary();
    }
  }, [userId]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('SummaryPage')}
      style={styles.cardWrapper}
    >
      <LinearGradient
        colors={['#4A70A9', '#2D4365']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Icon name="food-apple" size={24} color="#fff" />
            <Text style={styles.cardTitle}>Analisis Pola Konsumsi</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#fff" />
        </View>

        {loading || fetchingLatest ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.loadingText}>
              {loading ? 'Menganalisis...' : 'Memuat data...'}
            </Text>
          </View>
        ) : summary ? (
          <View>
            <Text style={styles.summaryText} numberOfLines={2}>
              {summary}
            </Text>
            <View style={styles.cardFooter}>
              <Icon name="history" size={16} color="#rgba(255,255,255,0.7)" />
              <Text style={styles.footerText}>
                Tap untuk lihat detail & history
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.emptyText}>Belum ada analisis minggu ini</Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateSummary}
              disabled={loading}
            >
              <Text style={styles.generateButtonText}>
                Generate Analisis Sekarang
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  card: {
    padding: 20,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
});

export default HealthSummaryCard;
