import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductDetail } from '@/hooks/useProducts';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { userService } from '@/services/api/userService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const { data: product, isLoading, error } = useProductDetail(id as string);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading product details...
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorTitle, { color: theme.text }]}>Product Not Found</Text>
        <Text style={[styles.errorSubtitle, { color: theme.textSecondary }]}>
          This product might have been removed or is temporarily unavailable.
        </Text>
        <Button title="Back to Explore" onPress={() => router.back()} style={styles.backBtn} />
      </SafeAreaView>
    );
  }

  const images = product.image && product.image.length > 0 ? product.image : [];
  const hasDiscount = !!product.discountInfo && product.discountInfo.percentageSaved > 0;
  const stockQuantities = product.stockQuantities || {};

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to save items to your wishlist.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    try {
      await userService.toggleWishlist(product._id);
      setIsWishlisted((prev) => !prev);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update wishlist');
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      Alert.alert('Select Size', 'Please choose your preferred size before adding to cart.');
      return;
    }

    const availableStock = stockQuantities[selectedSize] ?? 10;
    if (availableStock <= 0) {
      Alert.alert('Out of Stock', `Size ${selectedSize} is currently out of stock.`);
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product._id, selectedSize);
      Alert.alert(
        'Added to Cart!',
        `${product.name} (Size ${selectedSize}) was added to your cart.`,
        [
          { text: 'Continue Shopping' },
          { text: 'View Cart', onPress: () => router.push('/cart' as any) },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Gallery Carousel */}
        <View style={styles.imageCarouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImageIndex(slide);
            }}
            scrollEventThrottle={16}>
            {images.map((imgUrl, idx) => (
              <Image
                key={idx}
                source={{ uri: imgUrl }}
                style={styles.carouselImage}
                contentFit="cover"
              />
            ))}
          </ScrollView>

          {/* Dots Indicator */}
          {images.length > 1 && (
            <View style={styles.paginationDots}>
              {images.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        idx === activeImageIndex ? '#2563EB' : 'rgba(255,255,255,0.6)',
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Back Button Overlay */}
          <Pressable onPress={() => router.back()} style={styles.floatingBackButton}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>

          {/* Wishlist Button Overlay */}
          <Pressable onPress={handleToggleWishlist} style={styles.floatingWishlistButton}>
            <Text style={styles.wishlistIcon}>{isWishlisted ? '♥' : '♡'}</Text>
          </Pressable>
        </View>

        {/* Product Info */}
        <View style={styles.detailsContainer}>
          <View style={styles.categoryRow}>
            <Text style={[styles.categoryTag, { color: theme.textSecondary }]}>
              {product.category} • {product.subCategory}
            </Text>
            {product.bestseller && (
              <View style={styles.bestsellerPill}>
                <Text style={styles.bestsellerText}>Bestseller</Text>
              </View>
            )}
          </View>

          <Text style={[styles.productName, { color: theme.text }]}>{product.name}</Text>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.text }]}>₹{product.price}</Text>
            {hasDiscount && product.originalPrice ? (
              <>
                <Text style={[styles.originalPrice, { color: theme.textSecondary }]}>
                  ₹{product.originalPrice}
                </Text>
                <View style={styles.discountPill}>
                  <Text style={styles.discountText}>
                    {product.discountInfo?.percentageSaved}% OFF
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Size Selector */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Size</Text>
              {selectedSize ? (
                <Text style={[styles.selectedSizeText, { color: '#2563EB' }]}>
                  Size: {selectedSize}
                </Text>
              ) : null}
            </View>

            <View style={styles.sizesRow}>
              {product.sizes.map((size) => {
                const isSelected = selectedSize === size;
                const inStock = (stockQuantities[size] ?? 1) > 0;

                return (
                  <Pressable
                    key={size}
                    onPress={() => inStock && setSelectedSize(size)}
                    style={[
                      styles.sizeButton,
                      {
                        backgroundColor: isSelected
                          ? '#2563EB'
                          : theme.backgroundElement,
                        borderColor: isSelected ? '#2563EB' : 'transparent',
                        opacity: inStock ? 1 : 0.4,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.sizeText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.text,
                          fontWeight: isSelected ? '800' : '600',
                          textDecorationLine: inStock ? 'none' : 'line-through',
                        },
                      ]}>
                      {size}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {product.description}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background }]}>
        <Button
          title={product.outOfStock ? 'Out of Stock' : 'Add to Cart'}
          onPress={handleAddToCart}
          disabled={product.outOfStock}
          style={styles.cartButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  loadingText: {
    marginTop: Spacing.three,
    fontSize: 15,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  backBtn: {
    width: 200,
  },
  imageCarouselContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.15,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.15,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  floatingBackButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  floatingWishlistButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistIcon: {
    color: '#EF4444',
    fontSize: 20,
  },
  detailsContainer: {
    padding: Spacing.four,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryTag: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bestsellerPill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestsellerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.four,
  },
  price: {
    fontSize: 24,
    fontWeight: '900',
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  discountPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
  section: {
    marginTop: Spacing.four,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  selectedSizeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sizeButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  sizeText: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  cartButton: {
    width: '100%',
  },
});
