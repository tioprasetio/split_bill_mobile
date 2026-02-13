import React, { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '@env';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkMode';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import CustomSplitDialog from './CustomSplitDialog';

const UploadedReceipt = ({ showHistory, fetchHistory }) => {
  const { user } = useAuth();
  const { isDarkMode } = useDarkMode();

  const [token, setToken] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptUri, setReceiptUri] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingParse, setLoadingParse] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [search, setSearch] = useState('');
  const [participants, setParticipants] = useState([]);
  const [parsedData, setParsedData] = useState(null);
  const [tempFilename, setTempFilename] = useState(null);
  const [uploadedReceipt, setUploadedReceipt] = useState(null);
  const [splits, setSplits] = useState([]);
  const [splitMode, setSplitMode] = useState('equal');
  const device = useCameraDevice('back');
  const [customSplitDialog, setCustomSplitDialog] = useState({
    isOpen: false,
    item: null,
  });

  // Kamera
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    loadToken();
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setUsers(data.filter(u => u.id !== user?.id));
    } catch (err) {
      console.error('Failed to load users', err);
    }
  }, [token, user?.id]);

  useEffect(() => {
    if (token && user?.id) {
      fetchUsers();
    }
  }, [token, user?.id, fetchUsers]);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
    } catch (error) {
      console.error('Failed to load token', error);
    }
  };

  // 🚀 FIXED: permission kamera
  const requestCameraPermission = async () => {
    try {
      // Request permission Android native
      const androidGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Izin Kamera',
          message: 'Aplikasi membutuhkan akses kamera untuk memindai struk',
          buttonNeutral: 'Tanya Nanti',
          buttonNegative: 'Tolak',
          buttonPositive: 'Izinkan',
        },
      );

      if (androidGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Izin Ditolak', 'Kamera tidak dapat diakses tanpa izin.');
        return false;
      }

      // Cek juga permission dari react-native-vision-camera
      const cameraPermission = await Camera.getCameraPermissionStatus();

      if (
        cameraPermission === 'denied' ||
        cameraPermission === 'not-determined'
      ) {
        const newPermission = await Camera.requestCameraPermission();
        if (newPermission === 'denied') {
          Alert.alert('Izin Ditolak', 'Kamera tidak dapat diakses tanpa izin.');
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  };

  const openCamera = async () => {
    const granted = await requestCameraPermission();
    if (granted) {
      setShowCamera(true);
    } else {
      Alert.alert('Izin Ditolak', 'Kamera tidak dapat diakses tanpa izin.');
    }
  };

  // 🚀 FIXED: pick image dengan react-native-image-picker terbaru
  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setReceiptUri(asset.uri);
      setReceiptFile({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'receipt.jpg',
      });
      setParsedData(null);
      setUploadedReceipt(null);
      setSplits([]);
    }
  };

  const handleParseReceipt = async () => {
    if (!receiptFile || participants.length === 0) {
      Alert.alert('Error', 'Upload struk dan pilih participants dulu!');
      return;
    }

    try {
      setLoadingParse(true);
      const formData = new FormData();
      formData.append('receipt', {
        uri: receiptFile.uri,
        type: receiptFile.type,
        name: receiptFile.name,
      });
      formData.append('lenderId', String(user?.id));
      formData.append(
        'participantIds',
        JSON.stringify([user?.id, ...participants.map(p => p.id)]),
      );
      formData.append('splitMode', splitMode);

      if (parsedData?.name) {
        formData.append('name', parsedData.name);
      }

      const res = await fetch(`${API_URL}/api/receipts/parse`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errorType === 'not_receipt') {
          Alert.alert('Error', 'File yang diupload bukan struk');
        } else {
          Alert.alert('Error', 'Gagal memproses receipt');
        }
        return;
      }

      const itemsWithTempId = data.parsedData.items.map((item, index) => ({
        ...item,
        id: `temp_${index}`,
        assignees: splitMode === 'equal' ? data.parsedData.participantIds : [],
      }));

      setParsedData({
        ...data.parsedData,
        items: itemsWithTempId,
      });

      setTempFilename(data.parsedData.tempFilename);

      Alert.alert(
        'Berhasil',
        "Receipt berhasil di-parse! Silakan edit jika perlu dan klik 'Simpan & Hitung Split'",
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Gagal memproses receipt');
    } finally {
      setLoadingParse(false);
    }
  };

  const handleSaveReceipt = async () => {
    if (!parsedData) {
      Alert.alert('Error', 'Tidak ada data untuk disimpan!');
      return;
    }

    try {
      setLoadingSave(true);

      const res = await fetch(`${API_URL}/api/receipts/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: parsedData.name,
          items: parsedData.items.map(item => ({
            name: item.name,
            qty: item.qty,
            price: item.price,
            assignees: item.assignees || [],
            customSplits: item.customSplits || [],
          })),

          lenderId: parsedData.lenderId,
          participantIds: parsedData.participantIds,
          splitMode: parsedData.splitMode,
          tempFilename: tempFilename,
          rawText: parsedData.rawText,
        }),
      });

      const data = await res.json();

      setUploadedReceipt(data.receipt);

      const formattedSplits = data.billSplits.map(split => ({
        participantId: split.participantId,
        participantName: split.participant.name,
        amount: split.amount,
      }));
      setSplits(formattedSplits);

      setParsedData(null);
      setReceiptFile(null);
      setReceiptUri(null);

      Alert.alert(
        'Berhasil',
        'Receipt berhasil disimpan dan split bill dihitung!',
      );

      if (showHistory && fetchHistory) {
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Gagal menyimpan receipt');
    } finally {
      setLoadingSave(false);
    }
  };

  const handleUpdateReceipt = async () => {
    if (!uploadedReceipt) return;

    try {
      const res = await fetch(`${API_URL}/api/receipts/${uploadedReceipt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: uploadedReceipt.items,
          lenderId: user?.id,
          participants: participants.map(p => p.id),
          name: uploadedReceipt.name,
          splitMode: uploadedReceipt.splitMode,
        }),
      });
      const data = await res.json();
      setUploadedReceipt(data);
      setSplits(data.splits || []);
      Alert.alert('Berhasil', 'Receipt berhasil diperbarui!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Gagal update receipt');
    }
  };

  const openCustomSplitDialog = item => {
    setCustomSplitDialog({ isOpen: true, item });
  };

  const handleSaveCustomSplit = (itemId, splits) => {
    const targetData = parsedData || uploadedReceipt;
    if (!targetData) return;
    const newItems = [...targetData.items];
    const index = newItems.findIndex(i => i.id === itemId);
    if (index >= 0) {
      newItems[index].assignees = splits.map(s => s.userId);
      newItems[index].customSplits = splits;
      if (parsedData) setParsedData({ ...parsedData, items: newItems });
      else setUploadedReceipt({ ...uploadedReceipt, items: newItems });
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDarkMode ? '#404040' : '#fff',
      padding: 16,
      borderRadius: 8,
      marginTop: 16,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 16,
      color: isDarkMode ? '#f0f0f0' : '#000',
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
      color: isDarkMode ? '#f0f0f0' : '#000',
    },
    input: {
      backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#d1d5db',
      borderRadius: 100,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: isDarkMode ? '#f0f0f0' : '#000',
      marginBottom: 12,
    },
    buttonBase: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: '#4A70A9',
    },
    buttonOutlineText: {
      color: '#4A70A9',
      fontSize: 14,
      fontWeight: '500',
    },
    buttonText: {
      color: '#fff',
      fontWeight: '500',
      fontSize: 14,
    },
    previewImage: {
      width: '100%',
      height: 150,
      borderRadius: 6,
      marginVertical: 8,
    },
    participantChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#DCEAFF',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 8,
      marginBottom: 8,
    },
    participantText: {
      color: '#16335F',
      fontSize: 14,
    },
    removeButton: {
      marginLeft: 8,
      color: '#dc2626',
      fontSize: 18,
      fontWeight: 'bold',
    },
    itemContainer: {
      padding: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#e5e7eb',
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#2a2a2a' : '#f9fafb',
      marginBottom: 12,
    },
    splitResult: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#e5e7eb',
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
      marginBottom: 12,
    },
    cameraContainer: {
      flex: 1,
      backgroundColor: 'black',
    },
    camera: {
      flex: 1,
    },
    cameraButtonContainer: {
      position: 'absolute',
      bottom: 30,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 20,
    },
    cameraButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 100,
    },
  });

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.title}>Upload Struk & Split Bill</Text>

        {/* Upload file */}
        <View style={{ marginBottom: 12 }}>
          {receiptUri && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: '#4A70A9', fontSize: 12 }}>
                File terpilih: {receiptFile?.name}
              </Text>
              <Image source={{ uri: receiptUri }} style={styles.previewImage} />
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={pickImage}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={['#4A70A9', '#2D4365']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.buttonBase}
              >
                <Text style={styles.buttonText}>Pilih File</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buttonBase, styles.buttonOutline, { flex: 1 }]}
              onPress={openCamera}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, styles.buttonOutlineText]}>
                Ambil Foto
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mode Split */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.label}>Mode Split</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => !parsedData && setSplitMode('equal')}
              style={{ flexDirection: 'row', alignItems: 'center' }}
              disabled={!!parsedData}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: '#4A70A9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                {splitMode === 'equal' && (
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: '#4A70A9',
                    }}
                  />
                )}
              </View>
              <Text style={{ color: isDarkMode ? '#f0f0f0' : '#000' }}>
                Bagi Rata
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => !parsedData && setSplitMode('perItem')}
              style={{ flexDirection: 'row', alignItems: 'center' }}
              disabled={!!parsedData}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: '#4A70A9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                {splitMode === 'perItem' && (
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: '#4A70A9',
                    }}
                  />
                )}
              </View>
              <Text style={{ color: isDarkMode ? '#f0f0f0' : '#000' }}>
                Per Item
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            {splitMode === 'equal'
              ? 'Total bill akan dibagi sama rata untuk semua partisipan'
              : 'Setiap partisipan hanya bayar item yang mereka pesan'}
            {parsedData && ' (Tidak dapat diubah setelah parsing)'}
          </Text>
        </View>

        {/* Pilih participants */}
        <Text style={styles.label}>Pilih Participants</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Cari participant..."
          placeholderTextColor="#999"
          style={styles.input}
          editable={!parsedData}
        />

        {/* Dropdown hasil search */}
        {search && !parsedData && (
          <View
            style={{
              borderWidth: 1,
              borderColor: isDarkMode ? '#555' : '#d1d5db',
              borderRadius: 10,
              overflow: 'hidden',
              maxHeight: 150,
              marginBottom: 12,
              paddingHorizontal: 8,
              backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
            }}
          >
            <ScrollView>
              {users
                .filter(
                  u =>
                    u.name.toLowerCase().includes(search.toLowerCase()) ||
                    u.email.toLowerCase().includes(search.toLowerCase()),
                )
                .filter(u => !participants.find(p => p.id === u.id))
                .map(u => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => {
                      setParticipants([...participants, u]);
                      setSearch('');
                    }}
                    style={{
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: isDarkMode ? '#444' : '#e5e7eb',
                    }}
                  >
                    <Text style={{ color: isDarkMode ? '#f0f0f0' : '#000' }}>
                      {u.name} ({u.email})
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}

        {/* List participants terpilih */}
        <View
          style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}
        >
          {participants.map(p => (
            <View key={p.id} style={styles.participantChip}>
              <Text style={styles.participantText}>{p.name}</Text>
              {!parsedData && (
                <TouchableOpacity
                  onPress={() =>
                    setParticipants(participants.filter(x => x.id !== p.id))
                  }
                >
                  <Text style={styles.removeButton}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Tombol Parse Receipt */}
        {!parsedData && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleParseReceipt}
            disabled={loadingParse}
          >
            <LinearGradient
              colors={['#4A70A9', '#2D4365']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.buttonBase}
            >
              {loadingParse ? (
                <ActivityIndicator color="#4A70A9" />
              ) : (
                <Text style={styles.buttonText}>Parse Receipt</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Detail Parsed Receipt */}
      {parsedData && (
        <View style={styles.container}>
          <Text style={styles.title}>Detail Receipt (Preview)</Text>

          <View
            style={{
              padding: 12,
              backgroundColor: '#dbeafe',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 12, color: '#1e40af' }}>
              Mode Split:{' '}
              {parsedData.splitMode === 'equal' ? 'Bagi Rata' : 'Per Item'}
            </Text>
            <Text style={{ fontSize: 12, color: '#ea580c', marginTop: 4 }}>
              Data ini belum disimpan. Edit jika perlu, lalu klik "Simpan &
              Hitung Split"
            </Text>
          </View>

          {/* Input nama receipt */}
          {parsedData && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Nama Receipt</Text>
              <TextInput
                value={parsedData?.name || ''}
                onChangeText={text =>
                  setParsedData({
                    ...parsedData,
                    name: text,
                  })
                }
                style={styles.input}
                placeholder="Misalnya: Makan Malam Bareng"
                placeholderTextColor="#999"
              />
            </View>
          )}

          <Text style={[styles.label, { marginBottom: 12 }]}>Items:</Text>
          {parsedData.items?.map((item, idx) => (
            <View key={item.id} style={styles.itemContainer}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <TextInput
                  value={item.name}
                  onChangeText={text => {
                    const newItems = [...parsedData.items];
                    newItems[idx].name = text;
                    setParsedData({ ...parsedData, items: newItems });
                  }}
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Nama item"
                />
                <TextInput
                  value={String(item.qty)}
                  onChangeText={text => {
                    const newItems = [...parsedData.items];
                    newItems[idx].qty = Number(text);
                    setParsedData({ ...parsedData, items: newItems });
                  }}
                  style={[
                    styles.input,
                    { width: 60, textAlign: 'center', marginBottom: 0 },
                  ]}
                  keyboardType="numeric"
                  placeholder="Qty"
                />
                <TextInput
                  value={String(item.price)}
                  onChangeText={text => {
                    const newItems = [...parsedData.items];
                    newItems[idx].price = Number(text);
                    setParsedData({ ...parsedData, items: newItems });
                  }}
                  style={[
                    styles.input,
                    { width: 100, textAlign: 'right', marginBottom: 0 },
                  ]}
                  keyboardType="numeric"
                  placeholder="Harga"
                />
              </View>

              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                Subtotal: Rp{(item.qty * item.price).toLocaleString()}
              </Text>

              {/* Assign participants untuk mode perItem */}
              {parsedData.splitMode === 'perItem' && (
                <View>
                  <Text style={[styles.label, { marginBottom: 8 }]}>
                    Siapa yang pesan item ini?
                  </Text>
                  {item.assignees &&
                    item.assignees.length > 1 &&
                    item.qty > 1 && (
                      <TouchableOpacity
                        onPress={() => openCustomSplitDialog(item)}
                        style={{ marginBottom: 8 }}
                      >
                        <Text
                          style={{
                            color: '#4A70A9',
                            fontWeight: '600',
                            fontSize: 13,
                          }}
                        >
                          Atur Pembagian →
                        </Text>
                      </TouchableOpacity>
                    )}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {[user, ...participants].map(
                      p =>
                        p && (
                          <TouchableOpacity
                            key={p.id}
                            onPress={() => {
                              const newItems = [...parsedData.items];
                              if (!newItems[idx].assignees)
                                newItems[idx].assignees = [];
                              const isAssigned = newItems[
                                idx
                              ].assignees.includes(p.id);
                              if (isAssigned) {
                                newItems[idx].assignees = newItems[
                                  idx
                                ].assignees.filter(id => id !== p.id);
                              } else {
                                newItems[idx].assignees.push(p.id);
                              }
                              setParsedData({ ...parsedData, items: newItems });
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderWidth: 1,
                              borderColor: isDarkMode ? '#444' : '#d1d5db',
                              borderRadius: 6,
                              marginRight: 8,
                              marginBottom: 8,
                              backgroundColor: item.assignees?.includes(p.id)
                                ? '#dcfce7'
                                : isDarkMode
                                ? '#1a1a1a'
                                : '#fff',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                color: item.assignees?.includes(p.id)
                                  ? '#166534'
                                  : isDarkMode
                                  ? '#f0f0f0'
                                  : '#000',
                              }}
                            >
                              {p.id === user?.id ? `${p.name} (Saya)` : p.name}
                            </Text>
                          </TouchableOpacity>
                        ),
                    )}
                  </View>
                </View>
              )}
            </View>
          ))}

          <View
            style={{
              padding: 12,
              backgroundColor: '#dcfce7',
              borderRadius: 8,
              marginTop: 16,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontWeight: '600', color: '#166534' }}>
              Total: Rp
              {parsedData.items
                ?.reduce((sum, item) => sum + item.qty * item.price, 0)
                .toLocaleString()}
            </Text>
          </View>

          {/* Tombol Simpan & Hitung Split */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSaveReceipt}
            disabled={loadingSave}
          >
            <LinearGradient
              colors={['#4A70A9', '#2D4365']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.buttonBase}
            >
              {loadingSave ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Simpan & Hitung Split</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Hasil Split Bill */}
      {splits.length > 0 && (
        <View style={styles.container}>
          <Text style={styles.title}>Hasil Split Bill</Text>

          <View
            style={{
              padding: 12,
              backgroundColor: '#dbeafe',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 12, color: '#1e40af' }}>
              Mode:{' '}
              {uploadedReceipt?.splitMode === 'equal'
                ? 'Bagi Rata'
                : 'Per Item'}
            </Text>
            <Text style={{ fontSize: 12, color: '#1e40af' }}>
              Total Bill: Rp
              {splits.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
            </Text>
          </View>

          {splits.map((s, idx) => (
            <View key={idx} style={styles.splitResult}>
              <Text
                style={{
                  fontWeight: '500',
                  color: isDarkMode ? '#f0f0f0' : '#000',
                }}
              >
                {s.participantName}
              </Text>
              <Text
                style={{ fontWeight: 'bold', color: '#2563eb', fontSize: 16 }}
              >
                Rp{s.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <Modal visible={showCamera} animationType="slide">
          <View style={styles.cameraContainer}>
            {device ? (
              <Camera
                ref={cameraRef}
                style={styles.camera}
                device={device}
                isActive={showCamera}
                photo={true}
              />
            ) : (
              <ActivityIndicator color="#fff" size="large" />
            )}

            <View style={styles.cameraButtonContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={async () => {
                  if (!cameraRef.current) return;

                  const photo = await cameraRef.current.takePhoto({
                    qualityPrioritization: 'balanced',
                  });

                  setReceiptUri(`file://${photo.path}`);
                  setReceiptFile({
                    uri: `file://${photo.path}`,
                    type: 'image/jpeg',
                    name: 'camera-capture.jpg',
                  });

                  setShowCamera(false);
                  setParsedData(null);
                  setUploadedReceipt(null);
                  setSplits([]);
                }}
              >
                <LinearGradient
                  colors={['#4A70A9', '#2D4365']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.cameraButton}
                >
                  <Text style={styles.buttonText}>Ambil Foto</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowCamera(false)}
              >
                <LinearGradient
                  colors={['#CF262B', '#A11E22']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.cameraButton}
                >
                  <Text style={styles.buttonText}>Batal</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <CustomSplitDialog
        isOpen={customSplitDialog.isOpen}
        onClose={() => setCustomSplitDialog({ isOpen: false, item: null })}
        item={customSplitDialog.item}
        participants={participants}
        onSave={handleSaveCustomSplit}
        isDarkMode={isDarkMode}
      />
    </ScrollView>
  );
};

export default UploadedReceipt;
