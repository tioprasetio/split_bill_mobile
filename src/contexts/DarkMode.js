import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'react-native';

// 1. Buat context
const DarkModeContext = createContext(undefined);

// 2. Provider component
const DarkModeContextProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 3. Load dark mode preference saat app pertama kali dibuka
  useEffect(() => {
    const loadDarkModePreference = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('darkMode');
        if (savedMode !== null) {
          setIsDarkMode(savedMode === 'true');
        }
      } catch (error) {
        console.error('Error loading dark mode preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDarkModePreference();
  }, []);

  // 4. Simpan ke AsyncStorage setiap kali isDarkMode berubah
  useEffect(() => {
    const saveDarkModePreference = async () => {
      try {
        await AsyncStorage.setItem('darkMode', String(isDarkMode));
      } catch (error) {
        console.error('Error saving dark mode preference:', error);
      }
    };

    if (!isLoading) {
      saveDarkModePreference();
    }
  }, [isDarkMode, isLoading]);

  // 5. Update StatusBar berdasarkan dark mode
  useEffect(() => {
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
  }, [isDarkMode]);

  return (
    <DarkModeContext.Provider value={{ isDarkMode, setIsDarkMode, isLoading }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// 6. Custom hook untuk menggunakan dark mode
export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error(
      'useDarkMode must be used within a DarkModeContextProvider',
    );
  }
  return context;
};

export { DarkModeContext };
export default DarkModeContextProvider;
