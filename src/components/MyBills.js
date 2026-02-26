import React, { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@env';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  Image,
  Linking,
  Share,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDarkMode } from '../contexts/DarkMode';
import LinearGradient from 'react-native-linear-gradient';
import PaymentInfoCard from './PaymentInfoCard';
import { useWhatsApp } from '../hooks/useWhatsApp';

const MyBills = () => {
  const { isDarkMode } = useDarkMode();
  const [token, setToken] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedBillDetail, setSelectedBillDetail] = useState(null);
  const { sendBillViaWhatsApp } = useWhatsApp();

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (token) {
      fetchMyBills();
    }
  }, [token, fetchMyBills]);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
    } catch (error) {
      console.error('Failed to load token', error);
    }
  };

  const fetchMyBills = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/my-bills`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setBills(data);
      } else {
        console.error('Failed to fetch bills:', await res.text());
      }
    } catch (err) {
      console.error('Failed to fetch bills:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyBills();
  };

  const handleViewDetail = async bill => {
    setSelectedBill(bill);
    setLoadingDetail(true);
    setShowDetail(true);

    try {
      const res = await fetch(`${API_URL}/api/receipts/${bill.receiptId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedBillDetail(data);
      }
    } catch (err) {
      console.error('Failed to fetch bill detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePayBill = bill => {
    sendBillViaWhatsApp(bill);
  };

  const handleShareBill = async bill => {
    const itemsList = bill.items
      .map(
        item =>
          `• ${item.name} (${item.qty}x) - Rp${(
            item.qty * item.price
          ).toLocaleString()}`,
      )
      .join('\n');

    const message =
      `📄 Tagihan Split Bill\n\n` +
      `Receipt: ${bill.receiptName}\n` +
      `Dari: ${bill.lenderName}\n` +
      `Jumlah: Rp${bill.amount.toLocaleString()}\n\n` +
      `Items:\n${itemsList}\n\n` +
      `Silakan konfirmasi pembayaran.`;

    try {
      await Share.share({
        message: message,
        title: 'Tagihan Split Bill',
      });
    } catch (error) {
      // Fallback to clipboard
      await Clipboard.setString(message);
      Alert.alert('Berhasil', 'Detail tagihan berhasil disalin!');
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDarkMode ? '#404040' : '#fff',
      padding: 16,
      borderRadius: 8,
      marginTop: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#f0f0f0' : '#000',
    },
    refreshButton: {
      padding: 8,
      borderRadius: 20,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 16,
    },
    emptyIcon: {
      fontSize: 72,
      color: '#d1d5db',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: '#6b7280',
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: '#9ca3af',
      marginBottom: 24,
      textAlign: 'center',
    },
    summaryCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      borderLeftWidth: 4,
      borderLeftColor: '#ef4444',
      backgroundColor: isDarkMode ? '#2a2a2a' : '#fee2e2',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: '#6b7280',
      marginBottom: 4,
    },
    summaryAmount: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#dc2626',
    },
    billCard: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#e5e7eb',
      backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
      borderRadius: 12,
      padding: 20,
      marginBottom: 12,
    },
    billsScrollView: {
      maxHeight: 550,
      marginBottom: 8,
    },
    billHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    billTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#f0f0f0' : '#000',
      maxWidth: '80%',
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDarkMode ? '#fca5a5' : '#991b1b',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 6,
    },

    amountContainer: {
      alignItems: 'flex-end',
      marginLeft: 12,
    },
    lenderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },

    lenderAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },

    lenderName: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#f0f0f0' : '#111827',
    },

    lenderEmail: {
      fontSize: 12,
      color: '#6b7280',
    },
    billInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    billInfoText: {
      fontSize: 14,
      color: '#6b7280',
      marginLeft: 8,
    },
    billAmount: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#dc2626',
      marginBottom: 4,
    },
    billAmountLabel: {
      fontSize: 12,
      color: '#9ca3af',
    },
    previewContainer: {
      backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333333' : '#F0F0F0',
    },

    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },

    previewTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: isDarkMode ? '#F0F0F0' : '#111827',
    },

    previewCountBadge: {
      backgroundColor: isDarkMode ? '#333333' : '#F3F4F6',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 100,
    },

    previewCountText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },

    previewDivider: {
      height: 1,
      backgroundColor: isDarkMode ? '#333333' : '#F0F0F0',
      marginBottom: 12,
    },

    previewItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },

    previewItemLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },

    previewItemName: {
      fontSize: 14,
      color: isDarkMode ? '#F0F0F0' : '#111827',
      flex: 1,
    },

    previewItemQty: {
      fontSize: 12,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      fontWeight: '500',
      minWidth: 35,
    },

    previewItemPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#F0F0F0' : '#111827',
      marginLeft: 12,
    },

    previewMoreContainer: {
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 12,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#333333' : '#F0F0F0',
    },

    previewMoreText: {
      fontSize: 13,
      color: '#4A70A9',
      fontWeight: '500',
    },

    previewTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#333333' : '#F0F0F0',
      borderStyle: 'dashed',
    },

    previewTotalLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#F0F0F0' : '#111827',
    },

    previewTotalAmount: {
      fontSize: 16,
      fontWeight: '700',
      color: '#4A70A9',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },

    actionButton: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
      minHeight: 40,
    },

    actionButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#fff',
    },
    tipsCard: {
      marginTop: 24,
      padding: 16,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#3b82f6',
      backgroundColor: isDarkMode ? '#2a2a2a' : '#dbeafe',
    },
    tipsTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: '#1e40af',
      marginBottom: 8,
    },
    tipText: {
      fontSize: 14,
      color: '#1d4ed8',
      marginBottom: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#404040' : '#fff',
      borderRadius: 12,
      padding: 24,
      width: '100%',
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDarkMode ? '#f0f0f0' : '#000',
    },
    closeButton: {
      fontSize: 32,
      color: '#9ca3af',
      fontWeight: '300',
    },
    detailCard: {
      padding: 16,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f9fafb',
      marginBottom: 24,
    },
    detailTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#f0f0f0' : '#000',
      marginBottom: 8,
    },
    // ========== MY BILL SECTION ==========
    myBillSection: {
      marginBottom: 24,
      backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333333' : '#F0F0F0',
    },

    myBillAmountContainer: {
      backgroundColor: isDarkMode ? '#2A2A2A' : '#F9FAFB',
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#333333' : '#F0F0F0',
    },

    myBillAmountLabel: {
      fontSize: 13,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      marginBottom: 8,
      fontWeight: '500',
    },

    myBillAmountValue: {
      fontSize: 28,
      fontWeight: '700',
      color: isDarkMode ? '#f87171' : '#dc2626',
    },

    myBillItemPrice: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#f87171' : '#dc2626',
    },

    myBillItems: {
      marginTop: 4,
      gap: 8,
    },

    myBillNote: {
      fontSize: 11,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      marginTop: 8,
      fontStyle: 'italic',
      textAlign: 'left',
    },

    itemsSection: {
      marginBottom: 24,
      backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333333' : '#F0F0F0',
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },

    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    sectionIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#F0F0F0' : '#111827',
    },

    sectionBadge: {
      backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 100,
    },

    sectionBadgeText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },

    itemsScrollView: {
      maxHeight: 300,
      paddingRight: 4,
    },

    itemCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#2A2A2A' : '#F9FAFB',
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333333' : '#FFFFFF',
    },

    itemInfo: {
      flex: 1,
      marginRight: 12,
    },

    itemNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },

    itemName: {
      fontSize: 15,
      fontWeight: '500',
      color: isDarkMode ? '#F0F0F0' : '#111827',
      flex: 1,
    },

    itemQtyBadge: {
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      backgroundColor: isDarkMode ? '#333333' : '#E5E7EB',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 100,
      overflow: 'hidden',
    },

    itemDetails: {
      fontSize: 13,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },

    itemPriceContainer: {
      alignItems: 'flex-end',
    },

    itemPrice: {
      fontSize: 16,
      fontWeight: '700',
      color: '#4A70A9',
    },

    itemsFooter: {
      marginTop: 12,
    },

    footerDivider: {
      height: 1,
      backgroundColor: isDarkMode ? '#333333' : '#F0F0F0',
      marginBottom: 12,
    },

    totalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 4,
    },

    totalLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#F0F0F0' : '#111827',
    },

    totalAmount: {
      fontSize: 18,
      fontWeight: '700',
      color: '#4A70A9',
    },

    modalButton: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      marginBottom: 8,
      gap: 6,
      minHeight: 40,
    },
    modalButtonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: '#4A70A9',
    },
    modalButtonText: {
      fontSize: 16,
      marginLeft: 8,
      fontWeight: '600',
      color: '#fff',
    },
    buttonOutlineText: {
      color: '#4A70A9',
      fontSize: 16,
    },
    noteCard: {
      marginTop: 24,
      padding: 16,
      borderRadius: 8,
      backgroundColor: isDarkMode ? 'rgba(113, 63, 18, 0.2)' : '#fef3c7',
    },
    noteText: {
      fontSize: 14,
      color: '#92400e',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <ActivityIndicator size="large" color="#4A70A9" />
          <Text
            style={{ marginTop: 8, color: isDarkMode ? '#f0f0f0' : '#000' }}
          >
            Memuat tagihan...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={{ flex: 1, paddingBottom: 100 }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Tagihan Saya</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchMyBills}
            >
              <Icon name="refresh" style={{ fontSize: 24, color: '#4A70A9' }} />
            </TouchableOpacity>
          </View>

          {bills.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyTitle}>Tidak Ada Tagihan</Text>
              <Text style={styles.emptyText}>
                Anda belum memiliki tagihan split bill yang perlu dibayar
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? '#2a2a2a' : '#f3f4f6',
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 8 }}>ℹ️</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                  Tagihan akan muncul saat Anda diundang ke split bill
                </Text>
              </View>
            </View>
          ) : (
            <>
              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View>
                    <Text style={styles.summaryLabel}>Total Tagihan</Text>
                    <Text style={styles.summaryAmount}>
                      Rp
                      {bills
                        .reduce((sum, bill) => sum + bill.amount, 0)
                        .toLocaleString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>
                      {bills.length} tagihan
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 4,
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#ef4444',
                          marginRight: 4,
                        }}
                      />
                      <Text style={{ fontSize: 12, color: '#dc2626' }}>
                        Belum Lunas
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* List Tagihan */}
              <ScrollView
                style={styles.billsScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
              >
                {bills.map((bill, index) => (
                  <View
                    key={`${bill.receiptId}-${index}`}
                    style={styles.billCard}
                  >
                    <View style={styles.billHeader}>
                      {/* KIRI */}
                      <View style={{ flex: 1 }}>
                        <View style={styles.titleRow}>
                          <Text style={styles.billTitle} numberOfLines={1}>
                            {bill.receiptName}
                          </Text>
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>Belum Bayar</Text>
                          </View>
                        </View>

                        <View style={styles.lenderRow}>
                          <Image
                            source={{
                              uri: bill.lender.profilePicture
                                ? `${API_URL}${bill.lender.profilePicture}`
                                : 'https://static.vecteezy.com/system/resources/previews/054/343/112/non_2x/a-person-icon-in-a-circle-free-png.png',
                            }}
                            style={styles.lenderAvatar}
                          />

                          <View>
                            <Text style={styles.lenderName}>
                              {bill.lender.name}
                            </Text>
                            <Text style={styles.lenderEmail}>
                              {bill.lender.email}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* KANAN */}
                      <View style={styles.amountContainer}>
                        <Text style={styles.billAmount}>
                          Rp{bill.amount.toLocaleString()}
                        </Text>
                        <Text style={styles.billAmountLabel}>
                          Total Tagihan
                        </Text>
                      </View>
                    </View>

                    {/* Preview Items */}
                    <View style={styles.previewContainer}>
                      {/* Header dengan jumlah item */}
                      <View style={styles.previewHeader}>
                        <Text style={styles.previewTitle}>Preview Items</Text>
                        <View style={styles.previewCountBadge}>
                          <Text style={styles.previewCountText}>
                            {bill.items.length} item
                          </Text>
                        </View>
                      </View>

                      {/* Divider tipis */}
                      <View style={styles.previewDivider} />

                      {/* List items - LEFT: nama & qty, RIGHT: total harga */}
                      {bill.items.slice(0, 3).map((item, index) => (
                        <View key={item.id} style={styles.previewItem}>
                          <View style={styles.previewItemLeft}>
                            <Text
                              style={styles.previewItemName}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>
                            <Text style={styles.previewItemQty}>
                              {item.qty}x
                            </Text>
                          </View>
                          <Text style={styles.previewItemPrice}>
                            Rp{(item.qty * item.price).toLocaleString()}
                          </Text>
                        </View>
                      ))}

                      {/* More items indicator - lebih clean */}
                      {bill.items.length > 3 && (
                        <View style={styles.previewMoreContainer}>
                          <Text style={styles.previewMoreText}>
                            +{bill.items.length - 3} item lainnya
                          </Text>
                        </View>
                      )}

                      {/* Total keseluruhan (optional) */}
                      <View style={styles.previewTotal}>
                        <Text style={styles.previewTotalLabel}>Total</Text>
                        <Text style={styles.previewTotalAmount}>
                          Rp
                          {bill.items
                            .reduce(
                              (sum, item) => sum + item.qty * item.price,
                              0,
                            )
                            .toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleViewDetail(bill)}
                        style={{ flex: 1 }}
                      >
                        <LinearGradient
                          colors={['#4A70A9', '#2D4365']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.actionButton}
                        >
                          <Text style={styles.actionButtonText}>Detail</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Tips Section */}
              <View style={styles.tipsCard}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'flex-start' }}
                >
                  <Text style={{ fontSize: 20, marginRight: 12 }}>ℹ️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tipsTitle}>Tips Pembayaran</Text>
                    <Text style={styles.tipText}>
                      • Klik "Bayar" untuk menghubungi lender via WhatsApp
                    </Text>
                    <Text style={styles.tipText}>
                      • Screenshot bukti transfer dan kirim ke lender
                    </Text>
                    <Text style={styles.tipText}>
                      • Simpan detail tagihan dengan klik "Share"
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Modal Detail Tagihan */}
      <Modal visible={showDetail} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detail Tagihan</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowDetail(false);
                    setSelectedBill(null);
                  }}
                >
                  <Text style={styles.closeButton}>×</Text>
                </TouchableOpacity>
              </View>

              {selectedBill && (
                <>
                  {/* Receipt Info */}
                  <View style={styles.detailCard}>
                    <Text style={styles.detailTitle}>
                      {selectedBill.receiptName}
                    </Text>
                    <View style={styles.lenderRow}>
                      <Image
                        source={{
                          uri: selectedBill.lender.profilePicture
                            ? `${API_URL}${selectedBill.lender.profilePicture}`
                            : 'https://static.vecteezy.com/system/resources/previews/054/343/112/non_2x/a-person-icon-in-a-circle-free-png.png',
                        }}
                        style={styles.lenderAvatar}
                      />

                      <View>
                        <Text style={styles.lenderName}>
                          {selectedBill.lender.name}
                        </Text>
                        <Text style={styles.lenderEmail}>
                          {selectedBill.lender.email}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Amount to Pay */}
                  <View style={styles.myBillSection}>
                    {/* Header dengan icon dan badge jumlah item */}
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleContainer}>
                        <View
                          style={[
                            styles.sectionIconContainer,
                            {
                              backgroundColor: isDarkMode
                                ? '#451a1a'
                                : '#fee2e2',
                            },
                          ]}
                        >
                          <Icon
                            name="wallet"
                            size={16}
                            color={isDarkMode ? '#f87171' : '#dc2626'}
                          />
                        </View>
                        <Text style={styles.sectionTitle}>Tagihan Saya</Text>
                      </View>
                      <View
                        style={[
                          styles.sectionBadge,
                          {
                            backgroundColor: isDarkMode ? '#451a1a' : '#fee2e2',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sectionBadgeText,
                            { color: isDarkMode ? '#f87171' : '#dc2626' },
                          ]}
                        >
                          {selectedBillDetail?.myItems?.length || 0} item
                        </Text>
                      </View>
                    </View>

                    {/* Amount Card - Simple & Clean */}
                    <View style={styles.myBillAmountContainer}>
                      <Text style={styles.myBillAmountLabel}>
                        Jumlah yang harus dibayar:
                      </Text>
                      <Text style={styles.myBillAmountValue}>
                        Rp{selectedBill.amount.toLocaleString()}
                      </Text>
                    </View>

                    {/* Items yang saya pesan - Style sama persis kayak items section */}
                    {loadingDetail ? (
                      <View
                        style={{ paddingVertical: 24, alignItems: 'center' }}
                      >
                        <ActivityIndicator size="large" color="#4A70A9" />
                        <Text
                          style={{
                            marginTop: 8,
                            color: isDarkMode ? '#f0f0f0' : '#6b7280',
                          }}
                        >
                          Memuat pesanan Anda...
                        </Text>
                      </View>
                    ) : (
                      <>
                        {selectedBillDetail?.myItems?.length > 0 ? (
                          <View style={styles.myBillItems}>
                            {selectedBillDetail.myItems.map(item => (
                              <View key={item.id} style={styles.itemCard}>
                                {/* Kiri: Nama + Detail */}
                                <View style={styles.itemInfo}>
                                  <View style={styles.itemNameContainer}>
                                    <Text style={styles.itemQtyBadge}>
                                      {item.myQty % 1 === 0
                                        ? `${item.myQty}x`
                                        : `${item.myQty.toFixed(1)}x`}
                                    </Text>
                                    <Text
                                      style={styles.itemName}
                                      numberOfLines={1}
                                    >
                                      {item.name}
                                    </Text>
                                  </View>
                                  <Text style={styles.itemDetails}>
                                    @Rp{item.price.toLocaleString()}
                                  </Text>
                                </View>

                                {/* Kanan: Total Harga */}
                                <View style={styles.itemPriceContainer}>
                                  <Text style={styles.myBillItemPrice}>
                                    Rp{item.myCost.toLocaleString()}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <View style={styles.emptyContainer}>
                            <Icon
                              name="food-off"
                              size={40}
                              color={isDarkMode ? '#4b5563' : '#9ca3af'}
                            />
                            <Text style={styles.emptyText}>
                              Anda tidak memesan item apapun
                            </Text>
                            <Text
                              style={[
                                styles.emptyText,
                                { fontSize: 12, marginTop: 4 },
                              ]}
                            >
                              Tagihan ini mungkin dari split rata
                            </Text>
                          </View>
                        )}
                      </>
                    )}

                    {/* Footer Total Tagihan */}
                    {selectedBillDetail?.myItems?.length > 0 && (
                      <View style={styles.itemsFooter}>
                        <View style={styles.footerDivider} />
                        <View style={styles.totalContainer}>
                          <Text style={styles.totalLabel}>Total Tagihan</Text>
                          <Text
                            style={[styles.totalAmount, { color: '#dc2626' }]}
                          >
                            Rp{selectedBillDetail.myTotalBill.toLocaleString()}
                          </Text>
                        </View>
                        <Text style={styles.myBillNote}>
                          *Sudah termasuk porsi yang Anda pesan
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Items Detail */}
                  <View style={styles.itemsSection}>
                    {/* Header Section dengan Badge */}
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleContainer}>
                        <View style={styles.sectionIconContainer}>
                          <Icon
                            name="receipt"
                            size={16}
                            color={isDarkMode ? '#f0f0f0' : '#4A70A9'}
                          />
                        </View>
                        <Text style={styles.sectionTitle}>Daftar Belanja</Text>
                      </View>
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>
                          {selectedBill.items.length} item
                        </Text>
                      </View>
                    </View>

                    {/* Items List - LEFT: nama & qty, RIGHT: total harga */}
                    <ScrollView
                      style={styles.itemsScrollView}
                      showsVerticalScrollIndicator={false}
                    >
                      {selectedBill.items.map((item, index) => (
                        <View key={item.id} style={styles.itemCard}>
                          {/* Kiri: Nama + Detail */}
                          <View style={styles.itemInfo}>
                            <View style={styles.itemNameContainer}>
                              <Text style={styles.itemQtyBadge}>
                                {item.qty}x
                              </Text>
                              <Text style={styles.itemName} numberOfLines={1}>
                                {item.name}
                              </Text>
                            </View>
                            <Text style={styles.itemDetails}>
                              Rp{item.price.toLocaleString()}
                            </Text>
                          </View>

                          {/* Kanan: Total Harga */}
                          <View style={styles.itemPriceContainer}>
                            <Text style={styles.itemPrice}>
                              Rp{(item.qty * item.price).toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      ))}

                      {/* Empty State */}
                      {selectedBill.items.length === 0 && (
                        <View style={styles.emptyContainer}>
                          <Icon
                            name="shopping-outline"
                            size={32}
                            color={isDarkMode ? '#4b5563' : '#9ca3af'}
                          />
                          <Text style={styles.emptyText}>Belum ada item</Text>
                        </View>
                      )}
                    </ScrollView>

                    {/* Footer Total (optional) */}
                    {selectedBill.items.length > 0 && (
                      <View style={styles.itemsFooter}>
                        <View style={styles.footerDivider} />
                        <View style={styles.totalContainer}>
                          <Text style={styles.totalLabel}>Total Belanja</Text>
                          <Text style={styles.totalAmount}>
                            Rp
                            {selectedBill.items
                              .reduce(
                                (sum, item) => sum + item.qty * item.price,
                                0,
                              )
                              .toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <PaymentInfoCard user={selectedBill.lender} />

                  {/* Action Buttons */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handlePayBill(selectedBill)}
                    style={{ flex: 1 }}
                  >
                    <LinearGradient
                      colors={['#4A70A9', '#2D4365']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.modalButton}
                    >
                      <Text style={styles.modalButtonText}>
                        Hubungi Lender untuk Bayar
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleShareBill(selectedBill)}
                    style={[
                      styles.modalButton,
                      styles.modalButtonOutline,
                      { flex: 1 },
                    ]}
                  >
                    <Text
                      style={[styles.modalButtonText, styles.buttonOutlineText]}
                    >
                      Share Detail Tagihan
                    </Text>
                  </TouchableOpacity>

                  {/* Footer Note */}
                  <View style={styles.noteCard}>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'flex-start' }}
                    >
                      <Icon
                        name="alert-box-outline"
                        style={[
                          styles.noteText,
                          { fontSize: 20, marginRight: 12 },
                        ]}
                        color={isDarkMode ? '#f0f0f0' : '#000'}
                      />

                      <Text style={[styles.noteText, { flex: 1 }]}>
                        <Text style={{ fontWeight: 'bold' }}>Catatan:</Text>{' '}
                        Setelah melakukan transfer, jangan lupa kirim bukti
                        pembayaran ke lender untuk konfirmasi.
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default MyBills;
