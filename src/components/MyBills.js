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
  Share,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UploadProofButton } from './UploadProofButton';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDarkMode } from '../contexts/DarkMode';
import LinearGradient from 'react-native-linear-gradient';
import PaymentInfoCard from './PaymentInfoCard';
import { useWhatsApp } from '../hooks/useWhatsApp';
import { useAuth } from '../contexts/AuthContext';

const MyBills = ({ refreshRef }) => {
  const { isDarkMode } = useDarkMode();
  const [token, setToken] = useState(null);
  const [bills, setBills] = useState([]);
  const { user } = useAuth();
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

  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = fetchMyBills;
    }
  }, [refreshRef, fetchMyBills]);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
    } catch (error) {
      console.error('Failed to load token', error);
    }
  };

  const fetchMyBills = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/my-bills`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setBills(data.filter(b => b.status !== 'CONFIRMED'));
      } else {
        const errText = await res.text();
        console.error('Failed to fetch bills:', errText);

        // 🚨 HANDLE TOKEN INVALID
        if (errText.includes('Invalid token')) {
          await AsyncStorage.removeItem('token');
          console.log('Token dihapus, harus login ulang');
        }
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

  // ✅ FIX: billSplitId & status langsung dari /my-bills, sync dari detail
  const handleViewDetail = async bill => {
    setSelectedBill({
      ...bill,
      billSplitId: bill.billSplitId,
      status: bill.status || 'UNPAID',
    });
    setLoadingDetail(true);
    setShowDetail(true);

    try {
      const res = await fetch(`${API_URL}/api/receipts/${bill.receiptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedBillDetail(data);

        // ✅ Sync status terbaru dari detail
        if (data.splits) {
          const myBillSplit = data.splits.find(
            split => split.participantId === user?.id,
          );
          if (myBillSplit) {
            setSelectedBill(prev => ({
              ...prev,
              billSplitId: myBillSplit.id,
              status: myBillSplit.status || 'UNPAID',
            }));
          }
        }
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
            item.qty * item.price -
            (item.voucher || 0)
          ).toLocaleString()}`,
      )
      .join('\n');

    const message =
      `📄 Tagihan Split Bill\n\n` +
      `Receipt: ${bill.receiptName}\n` +
      `Dari: ${bill.lender.name}\n` +
      `Jumlah: Rp${bill.amount.toLocaleString()}\n\n` +
      `Items:\n${itemsList}\n\n` +
      `Silakan konfirmasi pembayaran.`;

    try {
      await Share.share({ message, title: 'Tagihan Split Bill' });
    } catch (error) {
      await Clipboard.setString(message);
      Alert.alert('Berhasil', 'Detail tagihan berhasil disalin!');
    }
  };

  // ✅ Helper badge dinamis
  const getBadgeConfig = status => {
    switch (status) {
      case 'PAID':
        return {
          bg: isDarkMode ? '#78350f' : '#fef3c7',
          text: isDarkMode ? '#fcd34d' : '#92400e',
          label: 'Menunggu Konfirmasi',
        };
      case 'CONFIRMED':
        return {
          bg: isDarkMode ? '#064e3b' : '#d1fae5',
          text: isDarkMode ? '#6ee7b7' : '#065f46',
          label: 'Lunas',
        };
      default: // UNPAID
        return {
          bg: isDarkMode ? '#7f1d1d' : '#fee2e2',
          text: isDarkMode ? '#fca5a5' : '#991b1b',
          label: 'Belum Bayar',
        };
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1f2937' : '#fff',
      padding: 16,
      borderRadius: 8,
      marginBottom: 0,
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
      color: isDarkMode ? '#f0f0f0' : '#252525',
    },
    refreshButton: { padding: 8, borderRadius: 20 },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 16,
    },
    emptyIcon: { fontSize: 72, color: '#d1d5db', marginBottom: 16 },
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
      backgroundColor: isDarkMode ? '#374151' : '#fee2e2',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: isDarkMode ? '#f0f0f0' : '#6b7280',
      marginBottom: 4,
    },
    summaryAmount: { fontSize: 24, fontWeight: 'bold', color: '#dc2626' },
    billCard: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#e5e7eb',
      backgroundColor: isDarkMode ? '#374151' : '#fff',
      borderRadius: 12,
      padding: 20,
      marginBottom: 12,
    },
    billsScrollView: { maxHeight: 550, marginBottom: 8 },
    billHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    billTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#f0f0f0' : '#252525',
      maxWidth: '80%',
    },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '500' },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 6,
    },
    amountContainer: { alignItems: 'flex-end', marginLeft: 12 },
    lenderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    lenderAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    lenderName: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#f0f0f0' : '#111827',
    },
    lenderEmail: { fontSize: 12, color: isDarkMode ? '#f0f0f0' : '#6b7280' },
    billAmount: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#dc2626',
      marginBottom: 4,
    },
    billAmountLabel: { fontSize: 12, color: '#9ca3af' },
    previewContainer: {
      backgroundColor: isDarkMode ? '#1f2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#374151' : '#F0F0F0',
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
      backgroundColor: isDarkMode ? '#374151' : '#F0F0F0',
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
    previewMoreText: { fontSize: 13, color: '#4A70A9', fontWeight: '500' },
    previewTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#374151' : '#F0F0F0',
      borderStyle: 'dashed',
    },
    previewTotalLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#F0F0F0' : '#111827',
    },
    previewTotalAmount: { fontSize: 16, fontWeight: '700', color: '#4A70A9' },
    actionButtons: { flexDirection: 'row', gap: 10, alignItems: 'center' },
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
    actionButtonText: { fontSize: 14, fontWeight: '500', color: '#fff' },
    tipsCard: {
      marginTop: 24,
      padding: 16,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#3b82f6',
      backgroundColor: isDarkMode ? '#374151' : '#dbeafe',
    },
    tipsTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDarkMode ? '#f0f0f0' : '#1e40af',
      marginBottom: 8,
    },
    tipText: {
      fontSize: 14,
      color: isDarkMode ? '#f0f0f0' : '#1d4ed8',
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
      backgroundColor: isDarkMode ? '#374151' : '#fff',
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
      color: isDarkMode ? '#f0f0f0' : '#252525',
    },
    closeButton: { fontSize: 32, color: '#9ca3af', fontWeight: '300' },
    detailCard: {
      padding: 16,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isDarkMode ? '#374151' : '#F0F0F0',
    },
    detailTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#f0f0f0' : '#252525',
      marginBottom: 8,
    },
    myBillSection: {
      marginBottom: 24,
      backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#374151' : '#F0F0F0',
    },
    myBillAmountContainer: {
      backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#374151' : '#F0F0F0',
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
    myBillItems: { marginTop: 4, gap: 8 },
    myBillNote: {
      fontSize: 11,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      marginTop: 8,
      fontStyle: 'italic',
      textAlign: 'left',
    },
    itemsSection: {
      marginBottom: 24,
      backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#374151' : '#F0F0F0',
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
    itemsScrollView: { paddingRight: 4 },
    itemCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#374151' : '#FFFFFF',
    },
    itemInfo: { flex: 1, marginRight: 12 },
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
      backgroundColor: isDarkMode ? '#111827' : '#E5E7EB',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 100,
      overflow: 'hidden',
    },
    itemDetails: { fontSize: 13, color: isDarkMode ? '#9CA3AF' : '#6B7280' },
    itemPriceContainer: { alignItems: 'flex-end' },
    itemPrice: { fontSize: 16, fontWeight: '700', color: '#4A70A9' },
    itemsFooter: { marginTop: 12 },
    footerDivider: {
      height: 1,
      backgroundColor: isDarkMode ? '#374151' : '#F0F0F0',
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
    totalAmount: { fontSize: 18, fontWeight: '700', color: '#4A70A9' },
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
      borderColor: isDarkMode ? '#608CCF' : '#4A70A9',
    },
    modalButtonText: {
      fontSize: 16,
      marginLeft: 8,
      fontWeight: '600',
      color: '#fff',
    },
    buttonOutlineText: {
      color: isDarkMode ? '#608CCF' : '#4A70A9',
      fontSize: 16,
    },
    noteCard: {
      marginTop: 24,
      padding: 16,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#111827' : '#fef3c7',
    },
    noteText: { fontSize: 14, color: '#FFFFFF' },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <ActivityIndicator size="large" color="#4A70A9" />
          <Text
            style={{ marginTop: 8, color: isDarkMode ? '#f0f0f0' : '#252525' }}
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
          {bills.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyTitle}>Tidak Ada Tagihan</Text>
              <Text style={styles.emptyText}>
                Semua tagihan sudah lunas atau belum ada tagihan baru
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? '#111827' : '#f3f4f6',
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
                    <Text
                      style={{
                        fontSize: 14,
                        color: isDarkMode ? '#f0f0f0' : '#6b7280',
                      }}
                    >
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
              >
                {bills.map((bill, index) => {
                  // ✅ Badge dinamis berdasarkan status
                  const badgeConfig = getBadgeConfig(bill.status);

                  return (
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
                            {/* ✅ Badge status dinamis */}
                            <View
                              style={[
                                styles.badge,
                                { backgroundColor: badgeConfig.bg },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.badgeText,
                                  { color: badgeConfig.text },
                                ]}
                              >
                                {badgeConfig.label}
                              </Text>
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
                        <View style={styles.previewHeader}>
                          <Text style={styles.previewTitle}>Preview Items</Text>
                          <View style={styles.previewCountBadge}>
                            <Text style={styles.previewCountText}>
                              {bill.items.length} item
                            </Text>
                          </View>
                        </View>
                        <View style={styles.previewDivider} />

                        {bill.items.slice(0, 3).map(item => (
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
                              Rp
                              {(
                                item.qty * item.price -
                                (item.voucher || 0)
                              ).toLocaleString()}
                            </Text>
                          </View>
                        ))}

                        {bill.items.length > 3 && (
                          <View style={styles.previewMoreContainer}>
                            <Text style={styles.previewMoreText}>
                              +{bill.items.length - 3} item lainnya
                            </Text>
                          </View>
                        )}

                        <View style={styles.previewTotal}>
                          <Text style={styles.previewTotalLabel}>
                            Subtotal Items
                          </Text>
                          <Text style={styles.previewTotalAmount}>
                            Rp
                            {bill.items
                              .reduce(
                                (sum, item) =>
                                  sum +
                                  (item.qty * item.price - (item.voucher || 0)),
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
                  );
                })}
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
                      • Upload bukti transfer agar lender bisa konfirmasi
                    </Text>
                    <Text style={styles.tipText}>
                      • Tagihan hilang otomatis setelah dikonfirmasi lender
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
                    setSelectedBillDetail(null);
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

                    <View style={styles.myBillAmountContainer}>
                      <Text style={styles.myBillAmountLabel}>
                        Jumlah yang harus dibayar:
                      </Text>
                      <Text style={styles.myBillAmountValue}>
                        Rp{selectedBill.amount.toLocaleString()}
                      </Text>
                    </View>

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
                              Tagihan ini dari split rata
                            </Text>
                          </View>
                        )}
                      </>
                    )}

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
                          *Sudah termasuk porsi yang Anda pesan dan juga biaya
                          layanan jika ada.
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Items Detail */}
                  <View style={styles.itemsSection}>
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

                    <ScrollView
                      style={styles.itemsScrollView}
                      showsVerticalScrollIndicator={false}
                    >
                      {selectedBill.items.map(item => (
                        <View key={item.id} style={styles.itemCard}>
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
                          <View style={styles.itemPriceContainer}>
                            {item.voucher > 0 && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: '#9ca3af',
                                  textDecorationLine: 'line-through',
                                }}
                              >
                                Rp{(item.qty * item.price).toLocaleString()}
                              </Text>
                            )}
                            <Text style={styles.itemPrice}>
                              Rp
                              {(
                                item.qty * item.price -
                                (item.voucher || 0)
                              ).toLocaleString()}
                            </Text>
                            {item.voucher > 0 && (
                              <Text style={{ fontSize: 11, color: '#16a34a' }}>
                                Hemat Rp{item.voucher.toLocaleString()}
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}

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

                    {selectedBill.items.length > 0 && (
                      <View style={styles.itemsFooter}>
                        <View style={styles.footerDivider} />
                        <View style={styles.totalContainer}>
                          <Text style={styles.totalLabel}>Total Belanja</Text>
                          <Text style={styles.totalAmount}>
                            Rp
                            {selectedBill.items
                              .reduce(
                                (sum, item) =>
                                  sum +
                                  (item.qty * item.price - (item.voucher || 0)),
                                0,
                              )
                              .toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <PaymentInfoCard user={selectedBill.lender} />

                  {/* Action Buttons berdasarkan status */}
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

                  {/* ✅ Upload bukti — hanya jika UNPAID */}
                  {selectedBill.status === 'UNPAID' && (
                    <UploadProofButton
                      billSplitId={selectedBill.billSplitId}
                      onUploadSuccess={() => {
                        Alert.alert(
                          'Sukses',
                          'Bukti terkirim, menunggu konfirmasi lender',
                        );
                        // ✅ Refresh status di modal
                        handleViewDetail(selectedBill);
                        // ✅ Refresh list bills
                        fetchMyBills();
                      }}
                    />
                  )}

                  {/* ✅ Status PAID */}
                  {selectedBill.status === 'PAID' && (
                    <View
                      style={[
                        styles.modalButton,
                        { backgroundColor: '#f59e0b', opacity: 0.8 },
                      ]}
                    >
                      <Icon name="clock-outline" size={20} color="#fff" />
                      <Text style={styles.modalButtonText}>
                        Menunggu Konfirmasi Lender
                      </Text>
                    </View>
                  )}

                  {/* ✅ Status CONFIRMED */}
                  {selectedBill.status === 'CONFIRMED' && (
                    <View
                      style={[
                        styles.modalButton,
                        { backgroundColor: '#10b981' },
                      ]}
                    >
                      <Icon name="check-circle" size={20} color="#fff" />
                      <Text style={styles.modalButtonText}>
                        Pembayaran Dikonfirmasi ✓
                      </Text>
                    </View>
                  )}

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

                  <LinearGradient
                    colors={['#4A70A9', '#2D4365']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.noteCard}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'flex-start' }}
                    >
                      <Icon
                        name="alert-box-outline"
                        style={[
                          styles.noteText,
                          { fontSize: 20, marginRight: 12 },
                        ]}
                        color={isDarkMode ? '#f0f0f0' : '#252525'}
                      />
                      <Text style={[styles.noteText, { flex: 1 }]}>
                        <Text style={{ fontWeight: 'bold' }}>Catatan:</Text>{' '}
                        Setelah melakukan transfer, upload bukti pembayaran agar
                        lender bisa konfirmasi.
                      </Text>
                    </View>
                  </LinearGradient>
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
