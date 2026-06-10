import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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

const STATUS_CONFIG = {
  UNPAID: { label: 'Belum Bayar', icon: 'clock-outline', ...COLORS.unpaid },
  PAID: { label: 'Menunggu Konfirmasi', icon: 'timer-sand', ...COLORS.paid },
  CONFIRMED: { label: 'Lunas', icon: 'check-circle', ...COLORS.confirmed },
};

const fmt = n => `Rp${Number(n).toLocaleString('id-ID')}`;

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.UNPAID;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Icon name={cfg.icon} size={12} color={cfg.text} />
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
};

export const BillSplitCard = ({ split, onViewProof, onConfirm }) => {
  const showProofBtn = split.status === 'PAID';
  const isConfirmed = split.status === 'CONFIRMED';

  return (
    <View style={styles.splitCard}>
      {/* Avatar + Name */}
      <View style={styles.splitRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {split.participantName?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>

        <View style={styles.splitInfo}>
          <Text style={styles.participantName}>{split.participantName}</Text>
          <Text style={styles.amountText}>{fmt(split.amount)}</Text>
          <StatusBadge status={split.status} />
        </View>

        {/* Actions */}
        <View style={styles.splitActions}>
          {showProofBtn && (
            <TouchableOpacity
              style={styles.proofBtn}
              onPress={() => onViewProof(split)}
            >
              <Icon
                name="image-search-outline"
                size={16}
                color={COLORS.secondary}
              />
              <Text style={styles.proofBtnText}>Lihat Bukti</Text>
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
          <Icon name="calendar-check-outline" size={12} color={COLORS.muted} />
          <Text style={styles.metaText}>
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

const styles = StyleSheet.create({
  splitCard: {
    backgroundColor: COLORS.item,
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
    color: COLORS.text,
  },
  amountText: {
    fontSize: 13,
    color: COLORS.secondary,
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
    color: COLORS.secondary,
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
    color: COLORS.muted,
  },
});