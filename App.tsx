import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigations/AppNavigator';
import DarkModeContextProvider from './src/contexts/DarkMode';

export default function App() {
  return (
    <DarkModeContextProvider>
      <AuthProvider>
      <AppNavigator />
    </AuthProvider>
    </DarkModeContextProvider>
    
  );
}
