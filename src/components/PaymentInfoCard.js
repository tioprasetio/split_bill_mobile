// components/PaymentInfo.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';

const PaymentInfoCard = ({ user }) => {
  if (!user?.payment_method) return null;

  const copyToClipboard = text => {
    Clipboard.setString(text);
    Alert.alert('Sukses', 'Nomor berhasil disalin!');
  };

  const getPaymentIcon = method => {
    switch (method) {
      case 'bank_transfer':
        return 'bank';
      case 'e_wallet':
        return 'wallet';
    }
  };

  const getPaymentLabel = method => {
    switch (method) {
      case 'bank_transfer':
        return 'Transfer Bank';
      case 'e_wallet':
        return 'E-Wallet';
      default:
        return method;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon
          name={getPaymentIcon(user.payment_method)}
          size={20}
          color="#4A70A9"
        />
        <Text style={styles.title}>Info Pembayaran</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.method}>
          Metode: {getPaymentLabel(user.payment_method)}
        </Text>

        {user.payment_method === 'bank_transfer' && (
          <>
            <Text style={styles.label}>Bank: {user.bank_name}</Text>
            <TouchableOpacity
              style={styles.copyRow}
              onPress={() => copyToClipboard(user.payment_account)}
            >
              <Text style={styles.value}>No. Rek: {user.payment_account}</Text>
              <Icon name="content-copy" size={16} color="#999" />
            </TouchableOpacity>
            <Text style={styles.label}>Atas Nama: {user.account_holder}</Text>
          </>
        )}

        {user.payment_method === 'e_wallet' && (
          <>
            <Text style={styles.label}>E-Wallet: {user.bank_name}</Text>
            <TouchableOpacity
              style={styles.copyRow}
              onPress={() => copyToClipboard(user.payment_account)}
            >
              <Text style={styles.value}>Nomor: {user.payment_account}</Text>
              <Icon name="content-copy" size={16} color="#999" />
            </TouchableOpacity>
            <Text style={styles.label}>Atas Nama: {user.account_holder}</Text>
          </>
        )}

        {user.phone && (
          <TouchableOpacity
            style={styles.phoneRow}
            onPress={() => copyToClipboard(user.phone)}
          >
            <Icon name="phone" size={16} color="#4A70A9" />
            <Text style={styles.phone}>Telepon: {user.phone}</Text>
            <Icon name="content-copy" size={16} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    gap: 8,
  },
  method: {
    fontSize: 14,
    color: '#4A70A9',
    fontWeight: '500',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  phone: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
});

export default PaymentInfoCard;
