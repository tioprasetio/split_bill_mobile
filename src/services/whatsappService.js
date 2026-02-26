import { WHATSAPP } from '../constants/whatsapp';

class WhatsAppService {
  static createUrl(phoneNumber, message) {
    const encodedMessage = encodeURIComponent(message);
    const baseUrl = WHATSAPP.BASE_URL;

    if (phoneNumber) {
      return `${baseUrl}?phone=${phoneNumber}&text=${encodedMessage}`;
    }

    return `${baseUrl}?text=${encodedMessage}`;
  }

  static createBillMessage(bill) {
    const lenderName = bill.lender?.name || 'Lender';
    const receiptName = bill.receiptName || 'tagihan';
    const amount = bill.amount?.toLocaleString() || '0';

    return `Halo ${lenderName}, saya ingin membayar tagihan split bill "${receiptName}" sebesar Rp${amount}. Mohon konfirmasi rekening untuk transfer.`;
  }
}

export default WhatsAppService;
