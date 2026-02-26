export const formatPhoneNumber = phone => {
  if (!phone) return null;

  // Hanya ambil angka
  const cleaned = phone.replace(/[^0-9]/g, '');

  if (!cleaned) return null;

  // Jika dimulai dengan '0', ganti dengan kode negara
  if (cleaned.startsWith('0')) {
    return `62${cleaned.substring(1)}`;
  }

  // Jika sudah dimulai dengan '62', gunakan apa adanya
  if (cleaned.startsWith('62')) {
    return cleaned;
  }

  // Jika tidak dimulai dengan '0' atau '62', tambahkan kode negara
  return `62${cleaned}`;
};
