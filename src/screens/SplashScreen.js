import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { StackActions, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkMode';

export default function SplashScreen() {
  const navigation = useNavigation();
  const { isLoggedIn } = useAuth();
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoggedIn) {
        navigation.dispatch(StackActions.replace('Home'));
      } else {
        navigation.dispatch(StackActions.replace('Login'));
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoggedIn, navigation]);

  const theme = {
    bg: isDarkMode ? '#111827' : '#fff',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Image
        source={require('../assets/logo-background.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200, // ubah sesuai kebutuhan
    height: 200,
  },
});
