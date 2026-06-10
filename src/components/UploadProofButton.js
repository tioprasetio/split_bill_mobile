// components/UploadProofButton.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { API_URL } from '@env';
import {
  ActivityIndicator,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // 🔥 PERBAIKAN IMPORT

export const UploadProofButton = ({ billSplitId, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, async response => {
      if (response.didCancel) return;

      setUploading(true);
      const file = response.assets[0];

      const formData = new FormData();
      formData.append('proof', {
        uri: file.uri,
        type: file.type,
        name: file.fileName || 'proof.jpg',
      });

      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(
          `${API_URL}/api/bill-splits/${billSplitId}/upload-proof`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          },
        );

        if (res.ok) {
          Alert.alert('Sukses', 'Bukti transfer terkirim!');
          onUploadSuccess?.();
        } else {
          Alert.alert('Error', 'Gagal upload bukti');
        }
      } catch (err) {
        Alert.alert('Error', 'Gagal upload bukti');
      } finally {
        setUploading(false);
      }
    });
  };

  return (
    <TouchableOpacity onPress={pickImage} disabled={uploading}>
      <LinearGradient
        colors={['#4A70A9', '#2D4365']}
        style={styles.button}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="cloud-upload" size={20} color="#fff" />
            <Text style={styles.buttonText}>Upload Bukti Transfer</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// 🔥 TAMBAHKAN STYLE DI SINI
const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 100,
    gap: 8,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
