// screens/ProfileScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@env';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from '../contexts/DarkMode';
import { useAuth } from '../contexts/AuthContext';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

// Components
import UploadedReceipt from '../components/uploadReceipt';
import MyBills from '../components/MyBills';
import HealthSummaryCard from '../components/HealthSummaryCard';

// ==================== CONSTANTS ====================
const COLORS = {
  // Primary
  primary: '#28A154',
  secondary: '#4A70A9',
  danger: '#CF262B',
  
  // Background
  darkBg: '#140C00',
  lightBg: '#f4f6f9',
  darkCard: '#404040',
  lightCard: '#FFFFFF',
  darkItem: '#2a2a2a',
  lightItem: '#f9f9f9',
  darkItemCard: '#1a1a1a',
  lightItemCard: '#fff',
  
  // Text
  textDark: '#353535',
  textLight: '#f0f0f0',
  textMuted: '#999',
  
  // Borders
  borderDark: '#555',
  borderLight: '#e0e0e0',
  
  // Badges
  success: '#d4edda',
  successText: '#155724',
  info: '#cfe2ff',
  infoText: '#084298',
};

const DEFAULT_AVATAR = 'https://static.vecteezy.com/system/resources/previews/054/343/112/non_2x/a-person-icon-in-a-circle-free-png.png';

// ==================== PROFILE SCREEN ====================
const ProfileScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useDarkMode();
  const { user, logout } = useAuth();
  
  // States
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    profile_picture: '',
    email: '',
  });
  
  // History state
  const [history, setHistory] = useState({
    show: false,
    receipts: [],
    selected: null,
    loading: false,
  });

  // ==================== HELPER FUNCTIONS ====================
  const getColor = (light, dark) => isDarkMode ? dark : light;
  const getBgColor = (light, dark) => ({ backgroundColor: getColor(light, dark) });
  const getBorderColor = (light, dark) => ({ borderColor: getColor(light, dark) });

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (user) {
      setLoading(false);
      setFormData({
        id: user.id || 0,
        name: user.name || '',
        profile_picture: typeof user.profile_picture === 'string' ? user.profile_picture : '',
        email: user.email || '',
      });
    } else {
      navigation.replace('Login');
    }
  }, [user, navigation]);

  // ==================== FETCH HISTORY ====================
  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;

    try {
      setHistory(prev => ({ ...prev, loading: true }));
      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${API_URL}/api/receipts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      const userReceipts = data
        .filter(receipt => receipt.userId === user.id)
        .map(receipt => ({
          id: receipt.id,
          name: receipt.name,
          extractedAt: receipt.extractedAt,
          splitMode: receipt.splitMode,
          total: receipt.items.reduce((sum, item) => sum + item.price * item.qty, 0),
          participantCount: receipt.billSplits.length,
          items: receipt.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            assignees: item.assignments?.map(a => ({ id: a.user.id, name: a.user.name })) || [],
          })),
          participants: receipt.billSplits.map(split => ({
            id: split.participant.id,
            name: split.participant.name,
            amount: split.amount,
          })),
        }))
        .sort((a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime());

      setHistory(prev => ({ ...prev, receipts: userReceipts }));
    } catch (err) {
      console.error('Failed to fetch history:', err);
      Alert.alert('Error', 'Gagal mengambil history');
    } finally {
      setHistory(prev => ({ ...prev, loading: false }));
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchHistory();
    }
  }, [user?.id, fetchHistory]);

  // ==================== HANDLER FUNCTIONS ====================
  const handleCopyToClipboard = (receipt) => {
    const message = `Split Bill - ${receipt.name}\n\n` +
      receipt.participants.map(p => `${p.name}: Rp${p.amount.toLocaleString()}`).join('\n') +
      `\n\nTotal: Rp${receipt.total.toLocaleString()}`;

    Clipboard.setString(message);
    Alert.alert('Sukses', 'Hasil split berhasil disalin!');
  };

  const handleShareWhatsApp = (receipt) => {
    const message = `Split Bill - ${receipt.name}\n\n` +
      receipt.participants.map(p => `${p.name}: Rp${p.amount.toLocaleString()}`).join('\n') +
      `\n\nTotal: Rp${receipt.total.toLocaleString()}`;

    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`)
      .catch(() => Alert.alert('Error', 'WhatsApp tidak terinstall'));
  };

  const handleDeleteReceipt = async (receipt) => {
    Alert.alert('Konfirmasi', 'Yakin ingin menghapus history ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/api/receipts/${receipt.id}`, {
              method: 'DELETE',
            });

            if (res.ok) {
              setHistory(prev => ({
                ...prev,
                receipts: prev.receipts.filter(r => r.id !== receipt.id),
                selected: null,
              }));
              Alert.alert('Sukses', 'History berhasil dihapus!');
            } else {
              Alert.alert('Error', 'Gagal menghapus history');
            }
          } catch (err) {
            console.error('Error deleting receipt:', err);
            Alert.alert('Error', 'Gagal menghapus history');
          }
        },
      },
    ]);
  };

  const toggleHistory = () => {
    setHistory(prev => {
      const newShow = !prev.show;
      if (newShow && prev.receipts.length === 0) {
        fetchHistory();
      }
      return { ...prev, show: newShow };
    });
  };

  const toggleReceiptDetail = (receipt) => {
    setHistory(prev => ({
      ...prev,
      selected: prev.selected?.id === receipt.id ? null : receipt,
    }));
  };

  // ==================== LOADING VIEW ====================
  if (loading) {
    return (
      <View style={[styles.loadingContainer, getBgColor(COLORS.lightBg, COLORS.darkBg)]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: getColor(COLORS.textDark, COLORS.textLight) }]}>
          Memuat data...
        </Text>
      </View>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <ScrollView style={[styles.container, getBgColor(COLORS.lightBg, COLORS.darkBg)]}>
      
      {/* ========== HEADER ========== */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: getColor(COLORS.textDark, COLORS.textLight) }]}>
          Akun saya
        </Text>
      </View>

      {/* ========== PROFILE CARD ========== */}
      <View style={[styles.profileCard, getBgColor(COLORS.lightCard, COLORS.darkCard)]}>
        <Image
          source={{ 
            uri: formData.profile_picture 
              ? `${API_URL}${formData.profile_picture}` 
              : DEFAULT_AVATAR 
          }}
          style={styles.profileImage}
        />

        <Text style={[styles.profileName, { color: getColor(COLORS.textDark, COLORS.textLight) }]}>
          {formData.name}
        </Text>

        <View style={styles.emailContainer}>
          <Icon name="email-outline" size={20} color={getColor(COLORS.textDark, COLORS.textLight)} />
          <Text style={[styles.emailText, { color: getColor(COLORS.textDark, COLORS.textLight) }]}>
            {formData.email}
          </Text>
        </View>

        <View style={{ width: '100%', gap: 10 }}>
          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient
              colors={[COLORS.secondary, '#2D4365']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={logout}>
            <LinearGradient
              colors={[COLORS.danger, '#A11E22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* ========== UPLOAD RECEIPT SECTION ========== */}
      <Text style={styles.sectionTitle}>Lakukan Split Bill</Text>
      <UploadedReceipt showHistory={history.show} fetchHistory={fetchHistory} />

      {/* ========== HEALTH SUMMARY CARD ========== */}
      <HealthSummaryCard userId={user?.id} isDarkMode={isDarkMode} />

      {/* ========== HISTORY SECTION ========== */}
      <View style={[styles.historyCard, getBgColor(COLORS.lightCard, COLORS.darkCard)]}>
        <View style={styles.historyHeader}>
          <Text style={[styles.historyTitle, { color: getColor(COLORS.textDark, COLORS.textLight) }]}>
            History Split Bills
          </Text>

          <TouchableOpacity onPress={toggleHistory}>
            {history.loading ? (
              <ActivityIndicator size="small" color={COLORS.secondary} />
            ) : (
              <Text style={styles.toggleText}>
                {history.show ? 'Sembunyikan' : 'Tampilkan'} ({history.receipts.length})
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {history.show && (
          <ScrollView
            style={styles.historyScrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <View style={styles.historyList}>
              {history.receipts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="receipt-outline" size={48} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>Belum ada history split bill tersimpan</Text>
                </View>
              ) : (
                history.receipts.map(receipt => (
                  <View key={receipt.id}>
                    {/* Receipt Card */}
                    <TouchableOpacity
                      style={[
                        styles.receiptCard,
                        getBgColor(COLORS.lightItem, COLORS.darkItem),
                        getBorderColor(COLORS.borderLight, COLORS.borderDark),
                      ]}
                      onPress={() => toggleReceiptDetail(receipt)}
                    >
                      <View style={styles.receiptHeader}>
                        <View style={styles.receiptInfo}>
                          <Text style={[styles.receiptName, { color: getColor(COLORS.textDark, COLORS.textLight) }]}>
                            {receipt.name}
                          </Text>

                          <View style={styles.receiptMeta}>
                            <Icon name="calendar" size={14} color={COLORS.textMuted} />
                            <Text style={styles.metaText}>
                              {new Date(receipt.extractedAt).toLocaleDateString('id-ID')}
                            </Text>

                            <Icon name="account-group" size={14} color={COLORS.textMuted} style={styles.metaIcon} />
                            <Text style={styles.metaText}>
                              {receipt.participantCount} orang
                            </Text>
                          </View>

                          <View style={[
                            styles.badge,
                            { backgroundColor: receipt.splitMode === 'equal' ? COLORS.success : COLORS.info }
                          ]}>
                            <Text style={[
                              styles.badgeText,
                              { color: receipt.splitMode === 'equal' ? COLORS.successText : COLORS.infoText }
                            ]}>
                              {receipt.splitMode === 'equal' ? 'Bagi Rata' : 'Per Item'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.receiptTotal}>
                          <Text style={styles.totalAmount}>
                            Rp{receipt.total.toLocaleString()}
                          </Text>
                          <Icon
                            name={history.selected?.id === receipt.id ? 'chevron-up' : 'chevron-down'}
                            size={24}
                            color={COLORS.textMuted}
                          />
                        </View>
                      </View>

                      {/* Expanded Details */}
                      {history.selected?.id === receipt.id && (
                        <View style={styles.expandedDetails}>
                          {/* Items List */}
                          <Text style={[styles.detailTitle, { color: getColor(COLORS.textDark, COLORS.textLight) }]}>
                            Daftar Item:
                          </Text>

                          {receipt.items.map(item => (
                            <View key={item.id} style={[
                              styles.itemCard,
                              getBgColor(COLORS.lightItemCard, COLORS.darkItemCard)
                            ]}>
                              <View style={styles.itemInfo}>
                                <Text style={[styles.itemName, { color: getColor(COLORS.textDark, COLORS.textLight) }]}>
                                  {item.name}
                                </Text>
                                <Text style={styles.itemQty}>
                                  {item.qty}x @ Rp{item.price.toLocaleString()}
                                </Text>
                                {receipt.splitMode === 'perItem' && item.assignees?.length > 0 && (
                                  <Text style={styles.assignees}>
                                    Dipesan: {item.assignees.map(a => a.name).join(', ')}
                                  </Text>
                                )}
                              </View>
                              <Text style={styles.itemTotal}>
                                Rp{(item.qty * item.price).toLocaleString()}
                              </Text>
                            </View>
                          ))}

                          {/* Participants */}
                          <Text style={[styles.detailTitle, { color: getColor(COLORS.textDark, COLORS.textLight) }]}>
                            Pembagian Biaya:
                          </Text>

                          {receipt.participants.map((participant, idx) => (
                            <View key={idx} style={[
                              styles.participantCard,
                              getBgColor(COLORS.lightItemCard, COLORS.darkItemCard)
                            ]}>
                              <Text style={[styles.participantName, { color: getColor(COLORS.textDark, COLORS.textLight) }]}>
                                {participant.name}
                              </Text>
                              <Text style={styles.participantAmount}>
                                Rp{participant.amount.toLocaleString()}
                              </Text>
                            </View>
                          ))}

                          {/* Action Buttons */}
                          <View style={styles.actionButtons}>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.copyButton]}
                              onPress={() => handleCopyToClipboard(receipt)}
                            >
                              <Icon name="content-copy" size={16} color="#fff" />
                              <Text style={styles.actionButtonText}>Copy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.actionButton, styles.shareButton]}
                              onPress={() => handleShareWhatsApp(receipt)}
                            >
                              <Icon name="whatsapp" size={16} color="#fff" />
                              <Text style={styles.actionButtonText}>Share</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.actionButton, styles.deleteButton]}
                              onPress={() => handleDeleteReceipt(receipt)}
                            >
                              <Icon name="delete" size={16} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}
      </View>

      <MyBills />
    </ScrollView>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
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
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    width: '100%',
    gap: 4,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#656565',
    marginVertical: 16,
  },
  historyCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  historyScrollView: {
    maxHeight: 200,
    marginBottom: 8,
  },
  historyList: {
    gap: 12,
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: 8,
  },
  receiptCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptInfo: {
    flex: 1,
  },
  receiptName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  receiptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  metaIcon: {
    marginLeft: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  receiptTotal: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemQty: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  assignees: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 4,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  participantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '500',
  },
  participantAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  copyButton: {
    backgroundColor: '#6b7280',
  },
  shareButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    flex: 0,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProfileScreen;