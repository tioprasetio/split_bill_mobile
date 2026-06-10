// src/screens/MaintenanceScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function MaintenanceScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Icon name="wrench-clock" size={64} color="#fff" />
      </View>
      <Text style={styles.title}>Sedang Maintenance</Text>
      <Text style={styles.subtitle}>
        Aplikasi sedang dalam perbaikan.{'\n'}
        Silakan coba lagi beberapa saat lagi. 🙏
      </Text>
      <View style={styles.badge}>
        <Icon name="clock-outline" size={14} color="#FFF" />
        <Text style={styles.badgeText}>We'll be back soon!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#4A70A9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#111827',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4A70A9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  badgeText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
