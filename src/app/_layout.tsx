import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryProvider>
      <AuthProvider>
        <CartProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <OfflineBanner />
            <AnimatedSplashOverlay />
            <AppTabs />
          </ThemeProvider>
        </CartProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
