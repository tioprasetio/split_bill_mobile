import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { StackActions } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

export default function SplashScreen({ navigation }) {
  const { isLoggedIn } = useAuth();

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

  return (
    <View style={styles.container}>
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
