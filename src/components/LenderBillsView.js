import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  RefreshControl,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_URL } from '@env';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const COLORS = {
  primary: '#5E88C8',
  secondary: '#4A70A9',
  danger: '#CF262B',
  warning: '#d97706',
  // Dark mode colors
  darkBg: '#111827',
  lightBg: '#f4f6f9',
  darkCard: '#1f2937',
  lightCard: '#ffffff',
  darkItem: '#374151',
  lightItem: '#f9f9f9',
  textDark: '#111827',
  textLight: '#f9fafb',
  textMuted: '#9ca3af',
  border: '#e0e0e0',
  darkBorder: '#374151',
  unpaid: { bg: '#fee2e2', text: '#dc2626' },
  paid: { bg: '#fef3c7', text: '#d97706' },
  confirmed: { bg: '#d1fae5', text: '#059669' },
  // Dark mode status colors
  darkUnpaid: { bg: '#7f1a1a', text: '#fca5a5' },
  darkPaid: { bg: '#78350f', text: '#fcd34d' },
  darkConfirmed: { bg: '#064e3b', text: '#6ee7b7' },
};

const STATUS_CONFIG = {
  UNPAID: { label: 'Belum Bayar', icon: 'clock-outline' },
  PAID: { label: 'Menunggu Konfirmasi', icon: 'timer-sand' },
  CONFIRMED: { label: 'Lunas', icon: 'check-circle' },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmt = n => `Rp${Number(n).toLocaleString('id-ID')}`;

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

const StatusBadge = ({ status, isDarkMode }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.UNPAID;

  // Pilih warna berdasarkan mode
  let bgColor, textColor;
  if (isDarkMode) {
    if (status === 'UNPAID') {
      bgColor = COLORS.darkUnpaid.bg;
      textColor = COLORS.darkUnpaid.text;
    } else if (status === 'PAID') {
      bgColor = COLORS.darkPaid.bg;
      textColor = COLORS.darkPaid.text;
    } else {
      bgColor = COLORS.darkConfirmed.bg;
      textColor = COLORS.darkConfirmed.text;
    }
  } else {
    if (status === 'UNPAID') {
      bgColor = COLORS.unpaid.bg;
      textColor = COLORS.unpaid.text;
    } else if (status === 'PAID') {
      bgColor = COLORS.paid.bg;
      textColor = COLORS.paid.text;
    } else {
      bgColor = COLORS.confirmed.bg;
      textColor = COLORS.confirmed.text;
    }
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Icon name={cfg.icon} size={12} color={textColor} />
      <Text style={[styles.badgeText, { color: textColor }]}>{cfg.label}</Text>
    </View>
  );
};

const ProofModal = ({
  visible,
  proofUrl,
  onClose,
  onConfirm,
  confirming,
  isDarkMode,
}) => {
  const bgColor = isDarkMode ? COLORS.darkCard : COLORS.lightCard;
  const textColor = isDarkMode ? COLORS.textLight : COLORS.textDark;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: bgColor }]}>
          <View
            style={[styles.modalHeader, { borderBottomColor: borderColor }]}
          >
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Bukti Transfer
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {proofUrl ? (
              <Image
                source={{ uri: `${API_URL}${proofUrl}` }}
                style={styles.proofImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noProof}>
                <Icon
                  name="image-off-outline"
                  size={48}
                  color={COLORS.textMuted}
                />
                <Text style={[styles.noProofText, { color: COLORS.textMuted }]}>
                  Bukti tidak tersedia
                </Text>
              </View>
            )}
          </ScrollView>

          {proofUrl && (
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                confirming && styles.confirmBtnDisabled,
              ]}
              onPress={onConfirm}
              disabled={confirming}
            >
              {confirming ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name="check-circle-outline" size={18} color="#fff" />
                  <Text style={styles.confirmBtnText}>
                    Konfirmasi Pembayaran
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ─── BILL SPLIT CARD ─────────────────────────────────────────────────────────

const BillSplitCard = ({ split, onViewProof, isDarkMode }) => {
  const showProofBtn = split.status === 'PAID';
  const isConfirmed = split.status === 'CONFIRMED';

  const cardBg = isDarkMode ? COLORS.darkItem : COLORS.lightItem;
  const textColor = isDarkMode ? COLORS.textLight : COLORS.textDark;
  const mutedColor = COLORS.textMuted;
  const amountColor = COLORS.primary;

  return (
    <View style={[styles.splitCard, { backgroundColor: cardBg }]}>
      {/* Avatar + Name */}
      <View style={styles.splitRow}>
        {split.participantPicture ? (
          <Image
            source={{
              uri: `${API_URL}${split.participantPicture}`,
            }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {split.participantName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}

        <View style={styles.splitInfo}>
          <Text style={[styles.participantName, { color: textColor }]}>
            {split.participantName}
          </Text>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {fmt(split.amount)}
          </Text>
          <StatusBadge status={split.status} isDarkMode={isDarkMode} />
        </View>

        {/* Actions */}
        <View style={styles.splitActions}>
          {showProofBtn && (
            <TouchableOpacity
              style={[
                styles.proofBtn,
                isDarkMode && { backgroundColor: '#374151' },
              ]}
              onPress={() => onViewProof(split)}
            >
              <Icon
                name="image-search-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={[styles.proofBtnText, { color: COLORS.primary }]}>
                Lihat Bukti
              </Text>
            </TouchableOpacity>
          )}

          {isConfirmed && (
            <View style={styles.confirmedIcon}>
              <Icon name="check-all" size={22} color={COLORS.primary} />
            </View>
          )}
        </View>
      </View>

      {/* Paid At */}
      {split.paidAt && (
        <View style={styles.metaRow}>
          <Icon name="calendar-check-outline" size={12} color={mutedColor} />
          <Text style={[styles.metaText, { color: mutedColor }]}>
            Dibayar:{' '}
            {new Date(split.paidAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}

      {split.confirmedAt && (
        <View style={styles.metaRow}>
          <Icon name="shield-check-outline" size={12} color={COLORS.primary} />
          <Text style={[styles.metaText, { color: COLORS.primary }]}>
            Dikonfirmasi:{' '}
            {new Date(split.confirmedAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── RECEIPT SECTION ─────────────────────────────────────────────────────────

const ReceiptSection = ({ receipt, onViewProof, isDarkMode }) => {
  const [expanded, setExpanded] = useState(false);

  const pendingCount = receipt.splits.filter(s => s.status === 'PAID').length;
  const confirmedCount = receipt.splits.filter(
    s => s.status === 'CONFIRMED',
  ).length;
  const total = receipt.splits.reduce((sum, s) => sum + s.amount, 0);

  const cardBg = isDarkMode ? COLORS.darkCard : COLORS.lightCard;
  const textColor = isDarkMode ? COLORS.textLight : COLORS.textDark;
  const mutedColor = COLORS.textMuted;

  return (
    <View style={[styles.receiptSection, { backgroundColor: cardBg }]}>
      {/* Receipt Header */}
      <TouchableOpacity
        style={styles.receiptHeader}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.8}
      >
        <View style={styles.receiptHeaderLeft}>
          <Icon name="receipt" size={20} color={COLORS.primary} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text
              style={[styles.receiptName, { color: textColor }]}
              numberOfLines={1}
            >
              {receipt.name}
            </Text>
            <Text style={[styles.receiptMeta, { color: mutedColor }]}>
              {receipt.splits.length} orang · {fmt(total)}
            </Text>
          </View>
        </View>

        <View style={styles.receiptHeaderRight}>
          {pendingCount > 0 && (
            <View style={styles.pendingDot}>
              <Text style={styles.pendingDotText}>{pendingCount}</Text>
            </View>
          )}
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={mutedColor}
          />
        </View>
      </TouchableOpacity>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${
                receipt.splits.length > 0
                  ? (confirmedCount / receipt.splits.length) * 100
                  : 0
              }%`,
            },
          ]}
        />
      </View>
      <Text style={[styles.progressLabel, { color: mutedColor }]}>
        {confirmedCount}/{receipt.splits.length} lunas
      </Text>

      {/* Bill Splits */}
      {expanded && (
        <View style={styles.splitsContainer}>
          {receipt.splits.map(split => (
            <BillSplitCard
              key={split.id}
              split={split}
              onViewProof={onViewProof}
              isDarkMode={isDarkMode}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const LenderBillsView = ({ userId, isDarkMode = false }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Modal state
  const [modal, setModal] = useState({
    visible: false,
    proofUrl: null,
    split: null,
    confirming: false,
  });

  // Get dynamic colors based on mode
  const bgColor = isDarkMode ? COLORS.darkBg : COLORS.lightBg;
  const cardBg = isDarkMode ? COLORS.darkCard : COLORS.lightCard;
  const textColor = isDarkMode ? COLORS.textLight : COLORS.textDark;
  const mutedColor = COLORS.textMuted;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  // ── Fetch all receipts where user is lender ──────────────────────────────
  const fetchLenderReceipts = useCallback(
    async (isRefresh = false) => {
      if (!userId) return;
      if (!isRefresh) setLoading(true);

      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/receipts`, { headers });
        const data = await res.json();

        // Filter receipts milik user ini (sebagai lender)
        const myReceipts = data
          .filter(r => r.userId === userId)
          .map(r => ({
            id: r.id,
            name: r.name,
            splitMode: r.splitMode,
            total: r.items.reduce((s, i) => s + i.price * i.qty, 0),
            splits: r.billSplits.map(bs => ({
              id: bs.id,
              participantId: bs.participant?.id,
              participantName: bs.participant?.name || 'Peserta',
              participantPicture: bs.participant?.profile_picture || null,
              amount: bs.amount,
              status: bs.status || 'UNPAID',
              paidAt: bs.paidAt,
              confirmedAt: bs.confirmedAt,
              paymentProof: bs.paymentProof,
            })),
          }))
          .sort((a, b) => b.id - a.id);

        setReceipts(myReceipts);
      } catch (err) {
        console.error('Error fetching lender receipts:', err);
        Alert.alert('Error', 'Gagal mengambil data tagihan');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    fetchLenderReceipts();
  }, [fetchLenderReceipts]);

  // ── View Proof ───────────────────────────────────────────────────────────
  const handleViewProof = async split => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/bill-splits/${split.id}/proof`, {
        headers,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Gagal mengambil bukti');

      setModal({
        visible: true,
        proofUrl: data.proofUrl,
        split,
        confirming: false,
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Gagal mengambil bukti transfer');
    }
  };

  // ── Confirm Payment ──────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!modal.split) return;
    setModal(prev => ({ ...prev, confirming: true }));

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${API_URL}/api/bill-splits/${modal.split.id}/confirm`,
        {
          method: 'PUT',
          headers,
        },
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Gagal konfirmasi');

      // Update state lokal — status jadi CONFIRMED
      setReceipts(prev =>
        prev.map(r => ({
          ...r,
          splits: r.splits.map(s =>
            s.id === modal.split.id
              ? {
                  ...s,
                  status: 'CONFIRMED',
                  confirmedAt: new Date().toISOString(),
                }
              : s,
          ),
        })),
      );

      setModal({
        visible: false,
        proofUrl: null,
        split: null,
        confirming: false,
      });
      Alert.alert(
        'Berhasil! ✅',
        `Pembayaran ${modal.split.participantName} telah dikonfirmasi.`,
      );
    } catch (err) {
      setModal(prev => ({ ...prev, confirming: false }));
      Alert.alert('Error', err.message || 'Gagal konfirmasi pembayaran');
    }
  };

  // ── Refresh ──────────────────────────────────────────────────────────────
  const onRefresh = () => {
    setRefreshing(true);
    fetchLenderReceipts(true);
  };

  // ── Empty / Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const hasPendingConfirmation = receipts.some(r =>
    r.splits.some(s => s.status === 'PAID'),
  );

  const filteredReceipts = receipts.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: mutedColor }]}>
          Tagihan yang Saya Buat
        </Text>
        {hasPendingConfirmation && (
          <View style={styles.alertBadge}>
            <Icon name="bell-ring-outline" size={12} color="#fff" />
            <Text style={styles.alertBadgeText}>
              Ada yang perlu dikonfirmasi
            </Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: cardBg,
            borderColor: borderColor,
          },
        ]}
      >
        <Icon name="magnify" size={18} color={mutedColor} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Cari nama receipt..."
          placeholderTextColor={mutedColor}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={16} color={mutedColor} />
          </TouchableOpacity>
        )}
      </View>

      {search.length > 0 && (
        <Text style={[styles.searchInfo, { color: mutedColor }]}>
          {filteredReceipts.length} hasil untuk "{search}"
        </Text>
      )}

      {filteredReceipts.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: cardBg }]}>
          <Icon
            name={search.length > 0 ? 'text-search' : 'receipt-text-outline'}
            size={48}
            color={mutedColor}
          />
          <Text style={[styles.emptyText, { color: mutedColor }]}>
            {search.length > 0
              ? `Tidak ada receipt "${search}"`
              : 'Belum ada receipt yang dibuat'}
          </Text>
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                Hapus pencarian
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredReceipts}
          keyExtractor={r => String(r.id)}
          renderItem={({ item }) => (
            <ReceiptSection
              receipt={item}
              onViewProof={handleViewProof}
              isDarkMode={isDarkMode}
            />
          )}
          scrollEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={isDarkMode ? COLORS.textLight : COLORS.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      {/* Proof Modal */}
      <ProofModal
        visible={modal.visible}
        proofUrl={modal.proofUrl}
        onClose={() =>
          setModal({
            visible: false,
            proofUrl: null,
            split: null,
            confirming: false,
          })
        }
        onConfirm={handleConfirm}
        confirming={modal.confirming}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 24,
    flex: 1,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  searchInfo: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 2,
  },

  // Empty
  emptyBox: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
  },

  // Receipt section
  receiptSection: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 2,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  receiptHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  receiptHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptName: {
    fontSize: 15,
    fontWeight: '700',
  },
  receiptMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  pendingDot: {
    backgroundColor: COLORS.warning,
    borderRadius: 100,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  pendingDotText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // Progress bar
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
  },

  // Splits container
  splitsContainer: {
    padding: 12,
    gap: 10,
  },

  // Split card
  splitCard: {
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  splitInfo: {
    flex: 1,
    gap: 3,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  splitActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  proofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f0fb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  proofBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  confirmedIcon: {
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 48,
  },
  metaText: {
    fontSize: 11,
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: 2,
    paddingVertical: 3,
    borderRadius: 100,
    gap: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalBody: {
    padding: 16,
    alignItems: 'center',
    minHeight: 200,
  },
  proofImage: {
    width: '100%',
    height: 420,
    borderRadius: 12,
  },
  noProof: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  noProofText: {
    fontSize: 14,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    margin: 16,
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default LenderBillsView;
