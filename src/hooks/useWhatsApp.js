// hooks/useWhatsApp.js (buat file baru untuk custom hook)
import { useCallback } from 'react';
import { Linking, Alert } from 'react-native';
import WhatsAppService from '../services/whatsappService';
import { formatPhoneNumber } from '../utils/phoneFormatter';

export const useWhatsApp = () => {
  const sendBillViaWhatsApp = useCallback(async bill => {
    try {
      // Validasi input
      if (!bill) {
        throw new Error('Data tagihan tidak ditemukan');
      }

      // Format nomor telepon
      const rawPhone = bill.lender?.phone;
      const formattedPhone = formatPhoneNumber(rawPhone);

      // Buat pesan
      const message = WhatsAppService.createBillMessage(bill);

      // Logging untuk debugging
      console.log('📱 WhatsApp Debug:', {
        originalPhone: rawPhone,
        formattedPhone,
        messagePreview: message.substring(0, 50) + '...',
        receiptName: bill.receiptName,
        amount: bill.amount,
      });

      // Buat URL
      const url = WhatsAppService.createUrl(formattedPhone, message);

      // Buka WhatsApp
      await Linking.openURL(url);
    } catch (error) {
      console.error('❌ WhatsApp Error:', error);

      // Tampilkan alert yang informatif
      Alert.alert(
        'Gagal Membuka WhatsApp',
        error.message === 'Data tagihan tidak ditemukan'
          ? 'Data tagihan tidak valid. Silakan coba lagi.'
          : 'Pastikan WhatsApp telah terinstall di perangkat Anda.',
        [{ text: 'OK' }],
      );
    }
  }, []);

  return { sendBillViaWhatsApp };
};
