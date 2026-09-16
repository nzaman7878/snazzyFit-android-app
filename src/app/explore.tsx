import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts, useSearchSuggestions } from '@/hooks/useProducts';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryPills } from '@/components/product/CategoryPills';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const CATEGORIES = ['All', 'Men', 'Women', 'Kids'];
const SUBCATEGORIES = ['All', 'Topwear', 'Bottomwear', 'Winterwear'];

export default function ExploreScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [sortType, setSortType] = useState<'low - high' | 'high - low' | undefined>(undefined);

  // Live auto-suggestions from backend
  const { data: suggestions = [] } = useSearchSuggestions(searchQuery);

  // Main product list
  const {
    data: productsData,
    isLoading,
    isRefetching,
    refetch,
  } = useProducts({
    search: searchQuery.trim() || undefined,
    category: selectedCategory === 'All' ? undefined : selectedCategory,
    subCategory: selectedSubCategory === 'All' ? undefined : selectedSubCategory,
    sortType,
    limit: 20,
  });

  const products = productsData?.products || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Bar Input */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search shirts, hoodies, jackets..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text style={[styles.clearBtn, { color: theme.textSecondary }]}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Live Search Suggestions Dropdown */}
        {searchQuery.length >= 2 && suggestions.length > 0 ? (
          <View
            style={[
              styles.suggestionsDropdown,
              {
                backgroundColor: theme.background,
                borderColor: theme.backgroundElement,
              },
            ]}>
            {suggestions.map((item) => (
              <Pressable
                key={item._id}
                onPress={() => {
                  setSearchQuery(item.name);
                }}
                style={styles.suggestionRow}>
                <Text style={[styles.suggestionText, { color: theme.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.suggestionPrice, { color: '#2563EB' }]}>
                  ₹{item.price}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {/* Category Pills */}
      <CategoryPills
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* SubCategory & Sort Filter Bar */}
      <View style={styles.subFilterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subScroll}>
          {SUBCATEGORIES.map((sub) => {
            const isSelected = selectedSubCategory === sub;
            return (
              <Pressable
                key={sub}
                onPress={() => setSelectedSubCategory(sub)}
                style={[
                  styles.subChip,
                  {
                    borderColor: isSelected ? '#2563EB' : theme.backgroundElement,
                    backgroundColor: isSelected ? 'rgba(37,99,235,0.1)' : 'transparent',
                  },
                ]}>
                <Text
                  style={[
                    styles.subChipText,
                    { color: isSelected ? '#2563EB' : theme.textSecondary },
                  ]}>
                  {sub}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Sort Button Toggle */}
        <Pressable
          onPress={() => {
            if (!sortType) setSortType('low - high');
            else if (sortType === 'low - high') setSortType('high - low');
            else setSortType(undefined);
          }}
          style={[styles.sortBtn, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.sortBtnText, { color: theme.text }]}>
            {sortType === 'low - high'
              ? 'Price: Low ↑'
              : sortType === 'high - low'
              ? 'Price: High ↓'
              : 'Sort'}
          </Text>
        </Pressable>
      </View>

      {/* Products Grid */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />
        }>
        {isLoading ? (
          <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
        ) : products.length > 0 ? (
          <View style={styles.productGrid}>
            {products.map((item) => (
              <ProductCard key={item._id} product={item} cardWidth="48%" />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Products Found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Try clearing filters or searching for something else.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    position: 'relative',
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  clearBtn: {
    fontSize: 16,
    padding: 4,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 56,
    left: Spacing.four,
    right: Spacing.four,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 20,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  subFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  subScroll: {
    flex: 1,
  },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 6,
  },
  subChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  loader: {
    marginTop: Spacing.six,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
