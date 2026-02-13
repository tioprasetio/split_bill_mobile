    import React, { useEffect, useState } from 'react';
    import { API_URL } from '@env';
    import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    Image,
    } from 'react-native';
    import { useAuth } from '../contexts/AuthContext';

    const CustomSplitDialog = ({
    isOpen,
    onClose,
    item,
    participants, // ✅ pastikan tiap participant punya field profile_picture (lihat catatan di bawah)
    onSave,
    isDarkMode = false,
    }) => {
    const { user } = useAuth();
    const [splits, setSplits] = useState([]);

    useEffect(() => {
        if (!item || !isOpen) return;

        const allParticipants = [user, ...participants].filter(Boolean);
        const assignedParticipants = allParticipants.filter(p =>
        item.assignees?.includes(p.id),
        );

        if (item.customSplits && item.customSplits.length > 0) {
        setSplits(item.customSplits);
        } else {
        const baseQty = Math.floor(item.qty / assignedParticipants.length);
        const remainder = item.qty % assignedParticipants.length;
        const initialSplits = assignedParticipants.map((p, idx) => ({
            userId: p.id,
            portion: baseQty + (idx < remainder ? 1 : 0),
        }));
        setSplits(initialSplits);
        }
    }, [item, isOpen, participants, user]);

    if (!item) return null;

    const totalPortions = splits.reduce((sum, s) => sum + s.portion, 0);
    const isValid = totalPortions === item.qty;

    // Gabungkan user login + participants — keduanya sudah punya profile_picture
    const allParticipants = [user, ...participants].filter(Boolean);

    const updatePortion = (userId, delta) => {
        setSplits(prev =>
        prev.map(s => {
            if (s.userId !== userId) return s;
            return { ...s, portion: Math.max(0, s.portion + delta) };
        }),
        );
    };

    const handleSave = () => {
        if (!isValid) {
        Alert.alert(
            'Pembagian Tidak Valid',
            `Total porsi (${totalPortions}) harus sama dengan qty item (${item.qty}).`,
        );
        return;
        }
        onSave(item.id, splits);
        onClose();
    };

    const getCost = portion => (portion / item.qty) * (item.qty * item.price);

    // Warna fallback jika foto tidak ada
    const getAvatarColor = name => {
        const palette = [
        { bg: '#dbeafe', text: '#1d4ed8' },
        { bg: '#dcfce7', text: '#15803d' },
        { bg: '#fef9c3', text: '#a16207' },
        { bg: '#fce7f3', text: '#be185d' },
        { bg: '#ede9fe', text: '#7c3aed' },
        { bg: '#ffedd5', text: '#c2410c' },
        ];
        const index = (name?.charCodeAt(0) || 0) % palette.length;
        return palette[index];
    };

    const c = {
        bg: isDarkMode ? '#2a2a2a' : '#ffffff',
        cardBg: isDarkMode ? '#1a1a1a' : '#f9fafb',
        border: isDarkMode ? '#555' : '#e5e7eb',
        text: isDarkMode ? '#f0f0f0' : '#111827',
        subText: isDarkMode ? '#aaa' : '#6b7280',
        overlay: 'rgba(0,0,0,0.6)',
    };

    return (
        <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        >
        <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
            <View style={[styles.dialog, { backgroundColor: c.bg }]}>

            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={[styles.headerTitle, { color: c.text }]}>
                    Atur Pembagian
                </Text>
                <Text
                    style={[styles.headerSubtitle, { color: c.subText }]}
                    numberOfLines={1}
                >
                    {item.name}
                </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
            </View>

            {/* Info item */}
            <View style={[
                styles.infoBox,
                {
                backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe',
                borderColor: isDarkMode ? '#2d5a9e' : '#bfdbfe',
                },
            ]}>
                <Text style={{ color: isDarkMode ? '#93c5fd' : '#1e40af', fontSize: 13 }}>
                Total qty:{' '}
                <Text style={{ fontWeight: '700' }}>{item.qty} porsi</Text>
                {'  •  '}
                Total harga:{' '}
                <Text style={{ fontWeight: '700' }}>
                    Rp{(item.qty * item.price).toLocaleString()}
                </Text>
                </Text>
            </View>

            {/* Status validasi */}
            <View style={[
                styles.validationBox,
                {
                backgroundColor: isValid
                    ? isDarkMode ? '#14532d' : '#dcfce7'
                    : isDarkMode ? '#7f1d1d' : '#fee2e2',
                borderColor: isValid
                    ? isDarkMode ? '#166534' : '#86efac'
                    : isDarkMode ? '#991b1b' : '#fca5a5',
                },
            ]}>
                <Text style={{
                color: isValid
                    ? isDarkMode ? '#86efac' : '#166534'
                    : isDarkMode ? '#fca5a5' : '#991b1b',
                fontSize: 13,
                fontWeight: '500',
                }}>
                {isValid
                    ? `✓ Pembagian valid (${totalPortions}/${item.qty} porsi)`
                    : `⚠ Total porsi: ${totalPortions}/${item.qty} — perlu disesuaikan`}
                </Text>
            </View>

            {/* Daftar participant */}
            <ScrollView style={styles.splitList} showsVerticalScrollIndicator={false}>
                {splits.map(split => {
                const participant = allParticipants.find(p => p.id === split.userId);
                if (!participant) return null;

                const isCurrentUser = participant.id === user?.id;
                const cost = getCost(split.portion);
                const avatarColor = getAvatarColor(participant.name);

                // ✅ Ambil profile_picture dari masing-masing participant
                // - user login: dari AuthContext (user.profile_picture)
                // - participant lain: dari data yang di-fetch di UploadedReceipt (/api/users)
                const profilePicture = participant.profile_picture;
                const avatarUri = profilePicture ? `${API_URL}${profilePicture}` : null;

                return (
                    <View
                    key={split.userId}
                    style={[
                        styles.participantRow,
                        { backgroundColor: c.cardBg, borderColor: c.border },
                    ]}
                    >
                    {/* Avatar + Nama */}
                    <View style={styles.participantInfo}>
                        {avatarUri ? (
                        // ✅ Ada foto → tampilkan foto profil
                        <Image
                            source={{ uri: avatarUri }}
                            style={styles.avatar}
                            defaultSource={{ uri: 'https://static.vecteezy.com/system/resources/previews/054/343/112/non_2x/a-person-icon-in-a-circle-free-png.png' }}
                        />
                        ) : (
                        // ✅ Tidak ada foto → tampilkan inisial nama
                        <View style={[
                            styles.avatar,
                            { backgroundColor: isDarkMode ? '#2d4365' : avatarColor.bg },
                        ]}>
                            <Text style={{
                            color: isDarkMode ? '#93c5fd' : avatarColor.text,
                            fontWeight: '700',
                            fontSize: 16,
                            }}>
                            {participant.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        )}

                        <View style={{ flex: 1 }}>
                        <Text
                            style={[styles.participantName, { color: c.text }]}
                            numberOfLines={1}
                        >
                            {participant.name}
                            {isCurrentUser && (
                            <Text style={{ color: '#4A70A9', fontSize: 12, fontWeight: '400' }}>
                                {' '}(Saya)
                            </Text>
                            )}
                        </Text>
                        <Text style={{ color: c.subText, fontSize: 12 }}>
                            Rp{Math.round(cost).toLocaleString()}
                        </Text>
                        </View>
                    </View>

                    {/* Kontrol porsi */}
                    <View style={styles.portionControl}>
                        <TouchableOpacity
                        onPress={() => updatePortion(split.userId, -1)}
                        disabled={split.portion <= 0}
                        style={[styles.portionButton, {
                            backgroundColor: split.portion <= 0
                            ? isDarkMode ? '#333' : '#f3f4f6'
                            : isDarkMode ? '#7f1d1d' : '#fee2e2',
                            borderColor: split.portion <= 0
                            ? isDarkMode ? '#555' : '#d1d5db'
                            : '#fca5a5',
                        }]}
                        >
                        <Text style={{
                            color: split.portion <= 0
                            ? isDarkMode ? '#555' : '#9ca3af'
                            : '#dc2626',
                            fontWeight: '700',
                            fontSize: 18,
                            lineHeight: 20,
                        }}>
                            −
                        </Text>
                        </TouchableOpacity>

                        <View style={[styles.portionDisplay, {
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                        borderColor: c.border,
                        }]}>
                        <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>
                            {split.portion}
                        </Text>
                        </View>

                        <TouchableOpacity
                        onPress={() => updatePortion(split.userId, 1)}
                        style={[styles.portionButton, {
                            backgroundColor: isDarkMode ? '#14532d' : '#dcfce7',
                            borderColor: '#86efac',
                        }]}
                        >
                        <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 18, lineHeight: 20 }}>
                            +
                        </Text>
                        </TouchableOpacity>
                    </View>
                    </View>
                );
                })}
            </ScrollView>

            {/* Tombol aksi */}
            <View style={styles.actions}>
                <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelButton, { borderColor: isDarkMode ? '#555' : '#d1d5db' }]}
                >
                <Text style={{ color: c.subText, fontWeight: '600' }}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                onPress={handleSave}
                disabled={!isValid}
                style={[styles.saveButton, {
                    backgroundColor: isValid ? '#4A70A9' : isDarkMode ? '#333' : '#e5e7eb',
                    opacity: isValid ? 1 : 0.6,
                }]}
                >
                <Text style={{
                    color: isValid ? '#fff' : isDarkMode ? '#555' : '#9ca3af',
                    fontWeight: '700',
                }}>
                    Simpan Pembagian
                </Text>
                </TouchableOpacity>
            </View>

            </View>
        </View>
        </Modal>
    );
    };

    const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    dialog: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 32,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '600',
    },
    infoBox: {
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 10,
    },
    validationBox: {
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 16,
    },
    splitList: {
        maxHeight: 320,
        marginBottom: 16,
    },
    participantRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    participantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
        marginRight: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    participantName: {
        fontSize: 14,
        fontWeight: '600',
    },
    portionControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    portionButton: {
        width: 34,
        height: 34,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    portionDisplay: {
        width: 38,
        height: 34,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 100,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    });

    export default CustomSplitDialog;