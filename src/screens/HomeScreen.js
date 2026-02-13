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
import UploadedReceipt from '../components/uploadReceipt';
import MyBills from '../components/MyBills';
import LinearGradient from 'react-native-linear-gradient';

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useDarkMode();
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    profile_picture: '',
    email: '',
  });
  const navigation = useNavigation();

  const [showHistory, setShowHistory] = useState(false);
  const [savedReceipts, setSavedReceipts] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(false);
    } else {
      navigation.replace('Login');
    }
  }, [user, navigation]);

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id || 0,
        name: user.name || '',
        profile_picture:
          typeof user.profile_picture === 'string' ? user.profile_picture : '',
        email: user.email || '',
      });
    }
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingHistory(true);
      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${API_URL}/api/receipts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      const userReceipts = data
        .filter(receipt => receipt.userId === user.id)
        .map(receipt => ({
          id: receipt.id,
          name: receipt.name,
          extractedAt: receipt.extractedAt,
          splitMode: receipt.splitMode,
          total: receipt.items.reduce(
            (sum, item) => sum + item.price * item.qty,
            0,
          ),
          participantCount: receipt.billSplits.length,
          items: receipt.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            assignees:
              item.assignments?.map(a => ({
                id: a.user.id,
                name: a.user.name,
              })) || [],
          })),
          participants: receipt.billSplits.map(split => ({
            id: split.participant.id,
            name: split.participant.name,
            amount: split.amount,
          })),
        }))
        .sort(
          (a, b) =>
            new Date(b.extractedAt).getTime() -
            new Date(a.extractedAt).getTime(),
        );

      setSavedReceipts(userReceipts);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchHistory();
    }
  }, [user?.id, fetchHistory]);

  const handleCopyToClipboard = receipt => {
    const message =
      `Split Bill - ${receipt.name}\n\n` +
      receipt.participants
        .map(p => `${p.name}: Rp${p.amount.toLocaleString()}`)
        .join('\n') +
      `\n\nTotal: Rp${receipt.total.toLocaleString()}`;

    Clipboard.setString(message);
    Alert.alert('Sukses', 'Hasil split berhasil disalin!');
  };

  const handleShareWhatsApp = receipt => {
    const message =
      `Split Bill - ${receipt.name}\n\n` +
      receipt.participants
        .map(p => `${p.name}: Rp${p.amount.toLocaleString()}`)
        .join('\n') +
      `\n\nTotal: Rp${receipt.total.toLocaleString()}`;

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'WhatsApp tidak terinstall');
    });
  };

  const handleDeleteReceipt = async receipt => {
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
              setSavedReceipts(savedReceipts.filter(r => r.id !== receipt.id));
              setSelectedHistory(null);
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

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDarkMode ? '#140C00' : '#f4f6f9' },
        ]}
      >
        <ActivityIndicator size="large" color="#28A154" />
        <Text
          style={[
            styles.loadingText,
            { color: isDarkMode ? '#f0f0f0' : '#353535' },
          ]}
        >
          Memuat data...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#140c00' : '#f4f6f9' },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon
            name="arrow-left"
            size={24}
            color={isDarkMode ? '#f0f0f0' : '#353535'}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: isDarkMode ? '#f0f0f0' : '#353535' },
          ]}
        >
          Akun saya
        </Text>
      </View>

      {/* Profile Card */}
      <View
        style={[
          styles.profileCard,
          { backgroundColor: isDarkMode ? '#404040' : '#FFFFFF' },
        ]}
      >
        <Image
          source={{
            uri: formData.profile_picture
              ? `${API_URL}${formData.profile_picture}`
              : 'https://static.vecteezy.com/system/resources/previews/054/343/112/non_2x/a-person-icon-in-a-circle-free-png.png',
          }}
          style={styles.profileImage}
        />

        <Text
          style={[
            styles.profileName,
            { color: isDarkMode ? '#f0f0f0' : '#353535' },
          ]}
        >
          {formData.name}
        </Text>

        <View style={styles.emailContainer}>
          <Icon
            name="email-outline"
            size={20}
            color={isDarkMode ? '#f0f0f0' : '#353535'}
          />
          <Text
            style={[
              styles.emailText,
              { color: isDarkMode ? '#f0f0f0' : '#353535' },
            ]}
          >
            {formData.email}
          </Text>
        </View>

        <View style={{ width: '100%', gap: 10 }}>
          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient
              colors={['#4A70A9', '#2D4365']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={logout}>
            <LinearGradient
              colors={['#CF262B', '#A11E22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upload Receipt Section */}
      <Text style={styles.sectionTitle}>Lakukan Split Bill</Text>
      <UploadedReceipt showHistory={showHistory} fetchHistory={fetchHistory} />

      {/* History Section */}
      <View
        style={[
          styles.historyCard,
          { backgroundColor: isDarkMode ? '#404040' : '#FFFFFF' },
        ]}
      >
        <View style={styles.historyHeader}>
          <Text
            style={[
              styles.historyTitle,
              { color: isDarkMode ? '#f0f0f0' : '#353535' },
            ]}
          >
            History Split Bills
          </Text>

          <TouchableOpacity
            onPress={() => {
              setShowHistory(!showHistory);
              if (!showHistory && savedReceipts.length === 0) {
                fetchHistory();
              }
            }}
          >
            {loadingHistory ? (
              <ActivityIndicator size="small" color="#4A70A9" />
            ) : (
              <Text style={styles.toggleText}>
                {showHistory ? 'Sembunyikan' : 'Tampilkan'} (
                {savedReceipts.length})
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {showHistory && (
          <ScrollView
            style={styles.historyScrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <View style={styles.historyList}>
              {savedReceipts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="receipt-outline" size={48} color="#999" />
                  <Text style={styles.emptyText}>
                    Belum ada history split bill tersimpan
                  </Text>
                </View>
              ) : (
                savedReceipts.map(receipt => (
                  <View key={receipt.id}>
                    <TouchableOpacity
                      style={[
                        styles.receiptCard,
                        {
                          backgroundColor: isDarkMode ? '#2a2a2a' : '#f9f9f9',
                          borderColor: isDarkMode ? '#555' : '#e0e0e0',
                        },
                      ]}
                      onPress={() =>
                        setSelectedHistory(
                          selectedHistory?.id === receipt.id ? null : receipt,
                        )
                      }
                    >
                      <View style={styles.receiptHeader}>
                        <View style={styles.receiptInfo}>
                          <Text
                            style={[
                              styles.receiptName,
                              { color: isDarkMode ? '#f0f0f0' : '#353535' },
                            ]}
                          >
                            {receipt.name}
                          </Text>

                          <View style={styles.receiptMeta}>
                            <Icon name="calendar" size={14} color="#999" />
                            <Text style={styles.metaText}>
                              {new Date(receipt.extractedAt).toLocaleDateString(
                                'id-ID',
                              )}
                            </Text>

                            <Icon
                              name="account-group"
                              size={14}
                              color="#999"
                              style={styles.metaIcon}
                            />
                            <Text style={styles.metaText}>
                              {receipt.participantCount} orang
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.badge,
                              {
                                backgroundColor:
                                  receipt.splitMode === 'equal'
                                    ? '#d4edda'
                                    : '#cfe2ff',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                {
                                  color:
                                    receipt.splitMode === 'equal'
                                      ? '#155724'
                                      : '#084298',
                                },
                              ]}
                            >
                              {receipt.splitMode === 'equal'
                                ? 'Bagi Rata'
                                : 'Per Item'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.receiptTotal}>
                          <Text style={styles.totalAmount}>
                            Rp{receipt.total.toLocaleString()}
                          </Text>
                          <Icon
                            name={
                              selectedHistory?.id === receipt.id
                                ? 'chevron-up'
                                : 'chevron-down'
                            }
                            size={24}
                            color="#999"
                          />
                        </View>
                      </View>

                      {/* Expanded Details */}
                      {selectedHistory?.id === receipt.id && (
                        <View style={styles.expandedDetails}>
                          {/* Items List */}
                          <Text
                            style={[
                              styles.detailTitle,
                              { color: isDarkMode ? '#f0f0f0' : '#353535' },
                            ]}
                          >
                            Daftar Item:
                          </Text>

                          {receipt.items.map(item => (
                            <View
                              key={item.id}
                              style={[
                                styles.itemCard,
                                {
                                  backgroundColor: isDarkMode
                                    ? '#1a1a1a'
                                    : '#fff',
                                },
                              ]}
                            >
                              <View style={styles.itemInfo}>
                                <Text
                                  style={[
                                    styles.itemName,
                                    {
                                      color: isDarkMode ? '#f0f0f0' : '#353535',
                                    },
                                  ]}
                                >
                                  {item.name}
                                </Text>
                                <Text style={styles.itemQty}>
                                  {item.qty}x @ Rp{item.price.toLocaleString()}
                                </Text>
                                {receipt.splitMode === 'perItem' &&
                                  item.assignees?.length > 0 && (
                                    <Text style={styles.assignees}>
                                      Dipesan:{' '}
                                      {item.assignees
                                        .map(a => a.name)
                                        .join(', ')}
                                    </Text>
                                  )}
                              </View>
                              <Text style={styles.itemTotal}>
                                Rp{(item.qty * item.price).toLocaleString()}
                              </Text>
                            </View>
                          ))}

                          {/* Participants */}
                          <Text
                            style={[
                              styles.detailTitle,
                              { color: isDarkMode ? '#f0f0f0' : '#353535' },
                            ]}
                          >
                            Pembagian Biaya:
                          </Text>

                          {receipt.participants.map((participant, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.participantCard,
                                {
                                  backgroundColor: isDarkMode
                                    ? '#1a1a1a'
                                    : '#fff',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.participantName,
                                  { color: isDarkMode ? '#f0f0f0' : '#353535' },
                                ]}
                              >
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
                              <Icon
                                name="content-copy"
                                size={16}
                                color="#fff"
                              />
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
    color: '#4A70A9',
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
    color: '#999',
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
    color: '#999',
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
    color: '#28A154',
    marginBottom: 4,
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
    color: '#999',
    marginTop: 2,
  },
  assignees: {
    fontSize: 11,
    color: '#2563eb',
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
    color: '#2563eb',
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
    backgroundColor: '#28A154',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
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
