// src/navigations/AppNavigator.js
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkMode';

// Auth screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OTPScreen from '../screens/OTPScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

// App screens
import HomeScreen from '../screens/HomeScreen';
import SplitBillScreen from '../screens/SplitBillScreen';
import TagihanScreen from '../screens/TagihanScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SummaryPage from '../screens/SummaryScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import BugScreen from '../screens/BugScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#5297FF',
  darkBg: '#1f2937',
  lightBg: '#ffffff',
  darkBorder: '#374151',
  lightBorder: '#e0e0e0',
  inactive: '#9ca3af',
};

// ── Bottom Tab Navigator (hanya muncul saat sudah login) ──────────────────────
function MainTabs() {
  const { isDarkMode } = useDarkMode();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: isDarkMode ? COLORS.darkBg : COLORS.lightBg,
          borderTopColor: isDarkMode ? COLORS.darkBorder : COLORS.lightBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home-variant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SplitBill"
        component={SplitBillScreen}
        options={{
          tabBarLabel: 'Split Bill',
          tabBarIcon: ({ color, size }) => (
            <Icon name="credit-card-scan-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tagihan"
        component={TagihanScreen}
        options={{
          tabBarLabel: 'Tagihan',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cash-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ── Root Stack Navigator ───────────────────────────────────────────────────────
export default function AppNavigator() {
  const { isLoggedIn, isMaintenance, loading } = useAuth();
  const navigationRef = useRef();

  useEffect(() => {
    // Handler untuk deep link
    const handleDeepLink = event => {
      const url = event.url;
      console.log('Deep link received:', url);

      if (url && url.includes('reset-password')) {
        const token = url.split('token=')[1];
        if (token && navigationRef.current) {
          // Navigate ke ResetPasswordScreen dengan token
          navigationRef.current.navigate('ResetPassword', { token });
        }
      }
    };

    // Add event listener untuk deep link saat app sudah running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle deep link saat app baru dibuka
    Linking.getInitialURL().then(url => {
      console.log('Initial URL:', url);
      if (url && url.includes('reset-password')) {
        const token = url.split('token=')[1];
        if (token) {
          // Delay sedikit untuk memastikan navigasi sudah ready
          setTimeout(() => {
            navigationRef.current?.navigate('ResetPassword', { token });
          }, 500);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={{
        prefixes: ['splitbill://'],
        config: {
          screens: {
            ResetPassword: 'reset-password',
          },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {loading ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : isMaintenance ? (
          <Stack.Screen name="Maintenance" component={MaintenanceScreen} />
        ) : isLoggedIn ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="SummaryPage" component={SummaryPage} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="BugScreen" component={BugScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splitBtnWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
  },
});
