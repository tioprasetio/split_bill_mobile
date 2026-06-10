import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

export default function HealthAlertModal({
  visible,
  alerts = [],
  onClose,
  isDarkMode,
}) {
  const card = isDarkMode ? '#1f2937' : '#ffffff';
  const textPrimary = isDarkMode ? '#f9fafb' : '#111827';
  const textMuted = '#9ca3af';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Icon name="alert-circle" size={28} color="#E98D24" />
            <Text style={[styles.title, { color: textPrimary }]}>
              Peringatan Kesehatan
            </Text>
          </View>

          <Text style={[styles.subtitle, { color: textMuted }]}>
            Konsumsi hari ini sudah melewati batas yang disarankan:
          </Text>

          {/* List alerts */}
          {alerts.map((alert, index) => (
            <View
              key={index}
              style={[
                styles.alertItem,
                {
                  backgroundColor:
                    alert.severity === 'danger' ? '#fee2e2' : '#fef3c7',
                  borderLeftColor:
                    alert.severity === 'danger' ? '#dc2626' : '#d97706',
                },
              ]}
            >
              <Icon
                name={alert.severity === 'danger' ? 'close-circle' : 'alert'}
                size={18}
                color={alert.severity === 'danger' ? '#dc2626' : '#d97706'}
              />
              <Text
                style={[
                  styles.alertText,
                  {
                    color: alert.severity === 'danger' ? '#991b1b' : '#92400e',
                  },
                ]}
              >
                {alert.message}
              </Text>
            </View>
          ))}

          {/* Tombol */}
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <LinearGradient
              colors={['#4A70A9', '#2D4365']}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>Saya Mengerti</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 18 },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  alertText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  btn: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  btnGradient: { paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
