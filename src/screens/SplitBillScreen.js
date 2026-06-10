import React, { useCallback, useEffect, useState } from 'react';

import { API_URL } from '@env';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  TextInput,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import { useDarkMode } from '../contexts/DarkMode';
import { useAuth } from '../contexts/AuthContext';
import UploadedReceipt from '../components/uploadReceipt';
import LenderBillsView from '../components/LenderBillsView';

const COLORS = {
  primary: '#4A70A9',
  secondary: '#4A70A9',
  lightBlue: '#79A8EF',
  danger: '#CF262B',
  darkBg: '#111827',
  lightBg: '#f4f6f9',
  darkCard: '#1f2937',
  lightCard: '#ffffff',
  textDark: '#111827',
  textLight: '#f9fafb',
  textMuted: '#9ca3af',
  success: '#d4edda',
  successText: '#152E57',
  info: '#cfe2ff',
  infoText: '#084298',
  borderDark: '#374151',
  borderLight: '#e5e7eb',
  darkItem: '#2a2a2a',
  lightItem: '#f9f9f9',
};

export default function SplitBillScreen() {
  const { isDarkMode } = useDarkMode();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'history' | 'konfirmasi'
  const [history, setHistory] = useState({ receipts: [], loading: false });
  const [selected, setSelected] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const bg = isDarkMode ? COLORS.darkBg : COLORS.lightBg;
  const card = isDarkMode ? COLORS.darkCard : COLORS.lightCard;
  const textPrimary = isDarkMode ? COLORS.textLight : COLORS.textDark;
  const textLightblue = isDarkMode ? COLORS.lightBlue : COLORS.primary;

  useEffect(() => {
    AsyncStorage.getItem('token').then(t => {
      setToken(t);
    });
  }, []);

  useEffect(() => {
    if (token && user?.id && activeTab === 'history') fetchHistory();
  }, [token, user?.id, activeTab, fetchHistory]);

  useEffect(() => {
    setSearch('');
  }, [activeTab]);

  const fetchHistory = useCallback(async () => {
    if (!token || !user?.id) return;
    setHistory(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`${API_URL}/api/receipts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : [];
      const mine = data
        .filter(r => r.userId === user.id)
        .map(r => {
          const subtotal = r.items.reduce((s, i) => {
            const effectivePrice = i.price - (i.voucher || 0);
            return s + effectivePrice * i.qty;
          }, 0);

          const taxAmount = Math.round((subtotal * (r.taxPercent || 0)) / 100);

          const total = subtotal + taxAmount;

          return {
            id: r.id,
            name: r.name,
            extractedAt: r.extractedAt,
            splitMode: r.splitMode,

            subtotal,
            taxPercent: r.taxPercent || 0,
            taxAmount,
            total,

            participantCount: r.billSplits.length,

            items: r.items.map(i => ({
              id: i.id,
              name: i.name,
              price: i.price,
              qty: i.qty,
              voucher: i.voucher || 0,

              assignees:
                i.assignments?.map(a => ({
                  id: a.user?.id,
                  name: a.user?.name,
                })) || [],
            })),

            participants: r.billSplits.map(s => ({
              id: s.participant?.id,
              name: s.participant?.name,
              amount: s.amount,
            })),
          };
        })
        .sort((a, b) => new Date(b.extractedAt) - new Date(a.extractedAt));
      setHistory({ receipts: mine, loading: false });
    } catch (e) {
      console.error(e);
      setHistory(prev => ({ ...prev, loading: false }));
    }
  }, [token, user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory().finally(() => setRefreshing(false));
  };

  const handleCopy = receipt => {
    const msg =
      `Split Bill - ${receipt.name}\n\n` +
      receipt.participants
        .map(p => `${p.name}: Rp${p.amount.toLocaleString()}`)
        .join('\n') +
      `\n\nTotal: Rp${receipt.total.toLocaleString()}`;
    Clipboard.setString(msg);
    Alert.alert('Sukses', 'Hasil split berhasil disalin!');
  };

  const handleShareWA = receipt => {
    const msg =
      `Split Bill - ${receipt.name}\n\n` +
      receipt.participants
        .map(p => `${p.name}: Rp${p.amount.toLocaleString()}`)
        .join('\n') +
      `\n\nTotal: Rp${receipt.total.toLocaleString()}`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`).catch(
      () => Alert.alert('Error', 'WhatsApp tidak terinstall'),
    );
  };

  const handleDelete = receipt => {
    Alert.alert('Hapus?', 'Yakin ingin menghapus history ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          const res = await fetch(`${API_URL}/api/receipts/${receipt.id}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            setHistory(prev => ({
              ...prev,
              receipts: prev.receipts.filter(r => r.id !== receipt.id),
            }));
            setSelected(null);
            Alert.alert('Sukses', 'History dihapus!');
          }
        },
      },
    ]);
  };

  const filteredReceipts = history.receipts.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const TABS = [
    { key: 'upload', label: 'Upload Struk', icon: 'camera-plus-outline' },
    { key: 'history', label: 'History', icon: 'history' },
    { key: 'konfirmasi', label: 'Konfirmasi', icon: 'check-decagram-outline' },
  ];

  const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    headerTitle: { fontSize: 24, fontWeight: '800' },
    headerSub: { fontSize: 13, marginTop: 4 },

    tabBar: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 8,
      marginTop: 8,
      borderRadius: 14,
      padding: 4,
      gap: 2,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 10,
      gap: 5,
    },
    tabActive: { backgroundColor: '#F0F2FD' },
    tabLabel: { fontSize: 12, fontWeight: '600' },

    content: { padding: 16 },

    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#374151' : '#e0e0e0',
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 8,
      gap: 8,
    },
    searchInput: { flex: 1, fontSize: 14, padding: 0 },
    searchInfo: {
      fontSize: 12,
      color: '#9ca3af',
      marginBottom: 8,
      marginLeft: 2,
    },

    infoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 14,
      borderRadius: 12,
      borderLeftWidth: 3,
      borderLeftColor: textLightblue,
    },
    infoText: { flex: 1, fontSize: 13 },

    emptyBox: {
      backgroundColor: COLORS.lightCard,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
      gap: 10,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700' },
    emptyText: { fontSize: 13, textAlign: 'center' },

    receiptCard: {
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    receiptRow: { flexDirection: 'row', alignItems: 'flex-start' },
    receiptName: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
    receiptMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 8,
    },
    metaText: { fontSize: 12, color: '#9ca3af', marginRight: 8 },
    modeBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 100,
    },
    modeBadgeText: { fontSize: 11, fontWeight: '600' },
    receiptTotal: { fontSize: 16, fontWeight: '800' },

    expanded: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#374151' : '#e0e0e0',
      gap: 8,
    },
    expandLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
    participantRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    participantName: { fontSize: 13 },
    participantAmt: { fontSize: 13, fontWeight: '600' },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4,
    },
    actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

    // ── Items list (lender history view) ───────────────────────────────
    itemHistRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      marginBottom: 4,
    },
    itemHistLeft: {
      flex: 1,
      marginRight: 10,
    },
    itemHistNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    itemHistQty: {
      fontSize: 11,
      fontWeight: '700',
      color: textLightblue,
      backgroundColor: isDarkMode ? '#1e2d42' : '#dce8f7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      overflow: 'hidden',
    },
    itemHistName: {
      fontSize: 13,
      fontWeight: '500',
      flex: 1,
    },
    itemHistPrice: {
      fontSize: 13,
      fontWeight: '600',
      color: textLightblue,
      marginTop: 2,
    },
    assigneeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    assigneeChip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 100,
    },
    assigneeText: {
      fontSize: 11,
      fontWeight: '500',
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* ── HEADER ── */}
      <View style={[styles.header, { backgroundColor: card }]}>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>
          Split Bill
        </Text>
        <Text style={[styles.headerSub, { color: COLORS.textMuted }]}>
          Upload, kelola, dan konfirmasi pembayaran
        </Text>
      </View>

      {/* ── TABS ── */}
      <View style={[styles.tabBar, { backgroundColor: card }]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Icon
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === tab.key ? COLORS.primary : COLORS.textMuted,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={
          activeTab === 'history' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {/* TAB: UPLOAD STRUK */}
        {activeTab === 'upload' && (
          <View style={{ gap: 16 }}>
            <View style={[styles.infoBox, { backgroundColor: card }]}>
              <Icon name="lightbulb-outline" size={18} color={COLORS.primary} />
              <Text style={[styles.infoText, { color: textPrimary }]}>
                Upload foto struk untuk split tagihan otomatis dengan AI
              </Text>
            </View>
            <UploadedReceipt />
          </View>
        )}

        {/* TAB: HISTORY */}
        {activeTab === 'history' && (
          <View>
            {history.receipts.length > 0 && (
              <View
                style={[
                  styles.searchBar,
                  isDarkMode && {
                    backgroundColor: COLORS.darkCard,
                    borderColor: COLORS.borderDark,
                  },
                ]}
              >
                <Icon name="magnify" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: textPrimary }]}
                  placeholder="Cari nama receipt..."
                  placeholderTextColor={COLORS.textMuted}
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Icon
                      name="close-circle"
                      size={16}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {search.length > 0 && (
              <Text
                style={[styles.searchInfo, isDarkMode && { color: '#6b7280' }]}
              >
                {filteredReceipts.length} hasil untuk "{search}"
              </Text>
            )}

            {history.loading ? (
              <ActivityIndicator
                color={COLORS.primary}
                style={{ marginTop: 40 }}
              />
            ) : filteredReceipts.length === 0 ? (
              <View style={[styles.emptyBox, , { backgroundColor: card }]}>
                <Icon
                  name={
                    search.length > 0 ? 'text-search' : 'receipt-text-outline'
                  }
                  size={52}
                  color={COLORS.textMuted}
                />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                  {search.length > 0 ? 'Tidak ditemukan' : 'Belum ada history'}
                </Text>
                <Text style={[styles.emptyText, { color: COLORS.textMuted }]}>
                  {search.length > 0
                    ? `Tidak ada receipt dengan nama "${search}"`
                    : 'Struk yang kamu upload akan muncul di sini'}
                </Text>
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Text
                      style={{
                        color: COLORS.primary,
                        fontSize: 13,
                        fontWeight: '600',
                        marginTop: 4,
                      }}
                    >
                      Hapus pencarian
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredReceipts.map(receipt => (
                <View
                  key={receipt.id}
                  style={[styles.receiptCard, { backgroundColor: card }]}
                >
                  <TouchableOpacity
                    onPress={() =>
                      setSelected(selected?.id === receipt.id ? null : receipt)
                    }
                  >
                    <View style={styles.receiptRow}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.receiptName, { color: textPrimary }]}
                          numberOfLines={1}
                        >
                          {receipt.name}
                        </Text>
                        <View style={styles.receiptMeta}>
                          <Icon
                            name="calendar-outline"
                            size={12}
                            color={COLORS.textMuted}
                          />
                          <Text style={styles.metaText}>
                            {new Date(receipt.extractedAt).toLocaleDateString(
                              'id-ID',
                            )}
                          </Text>
                          <Icon
                            name="account-group-outline"
                            size={12}
                            color={COLORS.textMuted}
                          />
                          <Text style={styles.metaText}>
                            {receipt.participantCount} orang
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.modeBadge,
                            {
                              backgroundColor:
                                receipt.splitMode === 'equal'
                                  ? COLORS.success
                                  : COLORS.info,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.modeBadgeText,
                              {
                                color:
                                  receipt.splitMode === 'equal'
                                    ? COLORS.successText
                                    : COLORS.infoText,
                              },
                            ]}
                          >
                            {receipt.splitMode === 'equal'
                              ? 'Bagi Rata'
                              : 'Per Item'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text
                          style={[styles.receiptTotal, { color: textLightblue }]}
                        >
                          Rp{receipt.total.toLocaleString()}
                        </Text>
                        <Icon
                          name={
                            selected?.id === receipt.id
                              ? 'chevron-up'
                              : 'chevron-down'
                          }
                          size={20}
                          color={COLORS.textMuted}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {selected?.id === receipt.id && (
                    <>
                      {/* ── Totals ── */}
                      <View style={{ ...styles.expanded, marginBottom: 10 }}>
                        <View style={styles.participantRow}>
                          <Text style={{ color: textPrimary }}>Subtotal</Text>
                          <Text style={{ color: textPrimary }}>
                            Rp{receipt.subtotal.toLocaleString()}
                          </Text>
                        </View>

                        {receipt.taxPercent > 0 && (
                          <View style={styles.participantRow}>
                            <Text style={{ color: textPrimary }}>
                              Pajak ({receipt.taxPercent}%)
                            </Text>
                            <Text style={{ color: textPrimary }}>
                              Rp{receipt.taxAmount.toLocaleString()}
                            </Text>
                          </View>
                        )}

                        <View style={styles.participantRow}>
                          <Text
                            style={{ fontWeight: '700', color: textPrimary }}
                          >
                            Total
                          </Text>
                          <Text style={{ fontWeight: '700', color: textLightblue }}>
                            Rp{receipt.total.toLocaleString()}
                          </Text>
                        </View>
                      </View>

                      {/* ── Daftar Item yang Dibeli ── */}
                      <View style={styles.expanded}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={[
                              styles.expandLabel,
                              { color: textPrimary, marginBottom: 0 },
                            ]}
                          >
                            Item Belanja:
                          </Text>
                          <View
                            style={{
                              backgroundColor: isDarkMode
                                ? '#1e2d42'
                                : '#dce8f7',
                              paddingHorizontal: 10,
                              paddingVertical: 3,
                              borderRadius: 100,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '600',
                                color: textLightblue,
                              }}
                            >
                              {receipt.items.length} item
                            </Text>
                          </View>
                        </View>

                        {receipt.items.map((item, i) => (
                          <View
                            key={item.id ?? i}
                            style={[
                              styles.itemHistRow,
                              {
                                backgroundColor: isDarkMode
                                  ? '#111827'
                                  : '#f4f6f9',
                              },
                            ]}
                          >
                            <View style={styles.itemHistLeft}>
                              <View style={styles.itemHistNameRow}>
                                <Text style={styles.itemHistQty}>
                                  {item.qty}x
                                </Text>
                                <Text
                                  style={[
                                    styles.itemHistName,
                                    { color: textPrimary },
                                  ]}
                                  numberOfLines={2}
                                >
                                  {item.name}
                                </Text>
                              </View>

                              {/* Assignees: tampil hanya di mode perItem */}
                              {receipt.splitMode === 'perItem' &&
                                item.assignees?.length > 0 && (
                                  <View style={styles.assigneeRow}>
                                    {item.assignees.map((a, ai) => (
                                      <View
                                        key={ai}
                                        style={[
                                          styles.assigneeChip,
                                          {
                                            backgroundColor: isDarkMode
                                              ? '#1e2d42'
                                              : '#dce8f7',
                                          },
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            styles.assigneeText,
                                            { color: textLightblue },
                                          ]}
                                        >
                                          {a.name}
                                        </Text>
                                      </View>
                                    ))}
                                  </View>
                                )}
                            </View>

                            <Text style={styles.itemHistPrice}>
                              Rp
                              {(
                                (item.price - (item.voucher || 0)) *
                                item.qty
                              ).toLocaleString()}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* ── Pembagian per Participant ── */}
                      <View style={styles.expanded}>
                        <Text
                          style={[styles.expandLabel, { color: textPrimary }]}
                        >
                          Pembagian:
                        </Text>

                        {receipt.participants.map((p, i) => (
                          <View key={i} style={styles.participantRow}>
                            <Text
                              style={[
                                styles.participantName,
                                { color: textPrimary },
                              ]}
                            >
                              {p.name}
                            </Text>

                            <Text
                              style={[
                                styles.participantAmt,
                                { color: COLORS.secondary },
                              ]}
                            >
                              Rp{p.amount.toLocaleString()}
                            </Text>
                          </View>
                        ))}

                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={[
                              styles.actionBtn,
                              { backgroundColor: '#6b7280' },
                            ]}
                            onPress={() => handleCopy(receipt)}
                          >
                            <Icon name="content-copy" size={14} color="#fff" />
                            <Text style={styles.actionBtnText}>Copy</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.actionBtn,
                              { backgroundColor: COLORS.primary },
                            ]}
                            onPress={() => handleShareWA(receipt)}
                          >
                            <Icon name="whatsapp" size={14} color="#fff" />
                            <Text style={styles.actionBtnText}>Share</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.actionBtn,
                              {
                                backgroundColor: COLORS.danger,
                                flex: 0,
                                paddingHorizontal: 14,
                              },
                            ]}
                            onPress={() => handleDelete(receipt)}
                          >
                            <Icon
                              name="delete-outline"
                              size={16}
                              color="#fff"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB: KONFIRMASI */}
        {activeTab === 'konfirmasi' && (
          <LenderBillsView userId={user?.id} isDarkMode={isDarkMode} />
        )}

        <View style={{ height: 0 }} />
      </ScrollView>
    </View>
  );
}