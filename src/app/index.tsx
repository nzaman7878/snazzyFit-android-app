import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryPills } from '@/components/product/CategoryPills';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const CATEGORIES = ['All', 'Men', 'Women', 'Kids'];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch bestsellers
  const {
    data: bestsellerData,
    isLoading: bestsellersLoading,
    refetch: refetchBestsellers,
  } = useProducts({ bestseller: true, limit: 6 });

  // Fetch category filtered products
  const {
    data: productsData,
    isLoading: productsLoading,
    isRefetching,
    refetch: refetchProducts,
  } = useProducts({
    category: selectedCategory === 'All' ? undefined : selectedCategory,
    limit: 10,
  });

  const onRefresh = async () => {
    await Promise.all([refetchBestsellers(), refetchProducts()]);
  };

  const bestsellers = bestsellerData?.products || [];
  const products = productsData?.products || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Brand Bar */}
      <View style={[styles.topBar, { borderBottomColor: theme.backgroundElement }]}>
        <View>
          <Text style={[styles.brandTitle, { color: theme.text }]}>Snazzyfit</Text>
          <Text style={[styles.brandTagline, { color: theme.textSecondary }]}>
            Premium Apparel & Fashion
          </Text>
        </View>

        {/* Search Input Button */}
        <Pressable
          onPress={() => router.push('/explore' as any)}
          style={[styles.searchBarShortcut, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.searchPlaceholder, { color: theme.textSecondary }]}>
            🔍 Search products...
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#2563EB" />
        }>
        {/* Hero Promotional Banner */}
        <Pressable
          onPress={() => router.push('/explore' as any)}
          style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Limited Edition</Text>
            </View>
            <Text style={styles.heroTitle}>Summer Collection</Text>
            <Text style={styles.heroSubtitle}>
              Exclusive styles with up to 40% OFF discounts!
            </Text>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Shop Now →</Text>
            </View>
          </View>
        </Pressable>

        {/* Bestseller Carousel */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>🔥 Bestsellers</Text>
            <Pressable onPress={() => router.push('/explore' as any)}>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>

          {bestsellersLoading ? (
            <ActivityIndicator size="small" color="#2563EB" style={styles.loader} />
          ) : bestsellers.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bestsellerScroll}>
              {bestsellers.map((item) => (
                <ProductCard key={item._id} product={item} cardWidth={160} />
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No bestsellers found.
            </Text>
          )}
        </View>

        {/* Category Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Explore by Category</Text>
          </View>
          <CategoryPills
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </View>

        {/* Latest Arrivals Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {selectedCategory === 'All' ? 'Latest Arrivals' : `${selectedCategory} Collection`}
            </Text>
            <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
              {products.length} items
            </Text>
          </View>

          {productsLoading ? (
            <ActivityIndicator size="small" color="#2563EB" style={styles.loader} />
          ) : products.length > 0 ? (
            <View style={styles.productGrid}>
              {products.map((item) => (
                <ProductCard key={item._id} product={item} cardWidth="48%" />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No products found in this category.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 12,
    marginBottom: Spacing.two,
  },
  searchBarShortcut: {
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  searchPlaceholder: {
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  heroBanner: {
    margin: Spacing.four,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    padding: Spacing.five,
    overflow: 'hidden',
  },
  heroContent: {
    zIndex: 1,
  },
  heroBadge: {
    backgroundColor: '#F59E0B',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: Spacing.two,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    marginBottom: Spacing.four,
  },
  heroCta: {
    backgroundColor: '#2563EB',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  heroCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginTop: Spacing.four,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  seeAllText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  resultsCount: {
    fontSize: 12,
  },
  bestsellerScroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
  },
  loader: {
    marginVertical: Spacing.four,
  },
  emptyContainer: {
    padding: Spacing.five,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
