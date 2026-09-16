import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Product } from '@/types/product';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export interface ProductCardProps {
  product: Product;
  cardWidth?: number | string;
}

export function ProductCard({ product, cardWidth = '48%' }: ProductCardProps) {
  const router = useRouter();
  const theme = useTheme();

  const primaryImage =
    product.image && product.image.length > 0
      ? product.image[0]
      : 'https://via.placeholder.com/300x400.png?text=No+Image';

  const hasDiscount = !!product.discountInfo && product.discountInfo.percentageSaved > 0;

  return (
    <Pressable
      onPress={() => router.push(`/product/${product._id}` as any)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          width: cardWidth as any,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}>
      {/* Product Image & Badges */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: primaryImage }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />

        {/* Bestseller Badge */}
        {product.bestseller && (
          <View style={styles.bestsellerBadge}>
            <Text style={styles.badgeText}>Bestseller</Text>
          </View>
        )}

        {/* Out of Stock Overlay */}
        {product.outOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>
              {product.discountInfo?.percentageSaved}% OFF
            </Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.infoContainer}>
        <Text style={[styles.categoryText, { color: theme.textSecondary }]}>
          {product.category} • {product.subCategory}
        </Text>

        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {product.name}
        </Text>

        {/* Pricing */}
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: theme.text }]}>₹{product.price}</Text>
          {hasDiscount && product.originalPrice ? (
            <Text style={[styles.originalPrice, { color: theme.textSecondary }]}>
              ₹{product.originalPrice}
            </Text>
          ) : null}
        </View>

        {/* Rating Stars */}
        {product.averageRating && product.averageRating > 0 ? (
          <View style={styles.ratingRow}>
            <Text style={styles.starText}>★</Text>
            <Text style={[styles.ratingValue, { color: theme.text }]}>
              {product.averageRating.toFixed(1)}
            </Text>
            {product.totalReviews ? (
              <Text style={[styles.reviewCount, { color: theme.textSecondary }]}>
                ({product.totalReviews})
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.four,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.85,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bestsellerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  outOfStockOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoContainer: {
    padding: Spacing.three,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
  },
  originalPrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  starText: {
    color: '#F59E0B',
    fontSize: 12,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  reviewCount: {
    fontSize: 11,
  },
});
