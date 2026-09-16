import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { wishlistService } from '@/services/api/wishlistService';
import { useAuth } from '@/context/AuthContext';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function WishlistScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  const {
    data: products = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['wishlist', 'products'],
    queryFn: () => wishlistService.getWishlistProducts(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={styles.icon}>♥</Text>
        <Text style={[styles.title, { color: theme.text }]}>Your Wishlist</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Sign in to view and save your favorite clothing and deals across your devices.
        </Text>
        <Button
          title="Sign In"
          onPress={() => router.push('/(auth)/login')}
          style={styles.actionBtn}
        />
      </SafeAreaView>
    );
  }

  if (isLoading && products.length === 0) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading your wishlist...
        </Text>
      </SafeAreaView>
    );
  }

  if (products.length === 0) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={styles.icon}>♡</Text>
        <Text style={[styles.title, { color: theme.text }]}>Your Wishlist is Empty</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Tap the heart icon on any product to save it here for later!
        </Text>
        <Button
          title="Explore Collection"
          onPress={() => router.push('/explore' as any)}
          style={styles.actionBtn}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          My Wishlist ({products.length})
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />
        }>
        <View style={styles.productGrid}>
          {products.map((item) => (
            <ProductCard key={item._id} product={item} cardWidth="48%" />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  icon: {
    fontSize: 56,
    color: '#EF4444',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.five,
  },
  actionBtn: {
    width: 200,
  },
  loadingText: {
    marginTop: Spacing.three,
    fontSize: 14,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
