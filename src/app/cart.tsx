import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const DELIVERY_CHARGE = 10;

export default function CartScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const { cartItems, cartCount, subtotal, updateQuantity, removeFromCart, isLoading } = useCart();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to proceed to checkout.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    router.push('/checkout' as any);
  };

  if (isLoading && cartItems.length === 0) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading cart...</Text>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={styles.emptyIcon}>🛍️</Text>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Your Cart is Empty</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Looks like you haven't added any apparel to your cart yet. Explore our latest collection!
        </Text>
        <Button
          title="Start Shopping"
          onPress={() => router.push('/explore' as any)}
          style={styles.shopBtn}
        />
      </SafeAreaView>
    );
  }

  const finalTotal = subtotal + DELIVERY_CHARGE;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          My Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cart Item Cards */}
        {cartItems.map((item) => {
          const product = item.product;
          const imageUrl =
            product?.image && product.image.length > 0
              ? product.image[0]
              : 'https://via.placeholder.com/150';

          return (
            <View
              key={item._id}
              style={[styles.itemCard, { backgroundColor: theme.backgroundElement }]}>
              {/* Thumbnail */}
              <Image source={{ uri: imageUrl }} style={styles.itemImage} contentFit="cover" />

              {/* Item Info */}
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                  {product?.name || 'Product'}
                </Text>

                <View style={styles.sizeBadge}>
                  <Text style={styles.sizeBadgeText}>Size: {item.size}</Text>
                </View>

                <Text style={[styles.itemPrice, { color: theme.text }]}>
                  ₹{product ? product.price * item.quantity : 0}
                  {item.quantity > 1 ? (
                    <Text style={[styles.unitPrice, { color: theme.textSecondary }]}>
                      {' '}
                      (₹{product?.price}/each)
                    </Text>
                  ) : null}
                </Text>

                {/* Stepper & Delete */}
                <View style={styles.actionRow}>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() => updateQuantity(item.itemId, item.size, item.quantity - 1)}
                      style={[styles.stepperBtn, { backgroundColor: theme.background }]}
                      hitSlop={8}>
                      <Text style={[styles.stepperText, { color: theme.text }]}>−</Text>
                    </Pressable>

                    <Text style={[styles.quantityText, { color: theme.text }]}>
                      {item.quantity}
                    </Text>

                    <Pressable
                      onPress={() => updateQuantity(item.itemId, item.size, item.quantity + 1)}
                      style={[styles.stepperBtn, { backgroundColor: theme.background }]}
                      hitSlop={8}>
                      <Text style={[styles.stepperText, { color: theme.text }]}>+</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() => removeFromCart(item.itemId, item.size)}
                    hitSlop={8}
                    style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        {/* Order Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Items Subtotal</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>₹{subtotal}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Standard Delivery
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>₹{DELIVERY_CHARGE}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.background }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: '#2563EB' }]}>₹{finalTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Checkout CTA */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background }]}>
        <View style={styles.bottomPriceInfo}>
          <Text style={[styles.bottomTotalLabel, { color: theme.textSecondary }]}>Total</Text>
          <Text style={[styles.bottomTotalPrice, { color: theme.text }]}>₹{finalTotal}</Text>
        </View>
        <Button
          title="Proceed to Checkout"
          onPress={handleCheckout}
          style={styles.checkoutBtn}
        />
      </View>
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.three,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.five,
  },
  shopBtn: {
    width: 200,
  },
  loadingText: {
    marginTop: Spacing.three,
    fontSize: 14,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: 100,
  },
  itemCard: {
    flexDirection: 'row',
    padding: Spacing.three,
    borderRadius: 16,
    marginBottom: Spacing.three,
  },
  itemImage: {
    width: 90,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  itemDetails: {
    flex: 1,
    marginLeft: Spacing.three,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  sizeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 4,
  },
  sizeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  unitPrice: {
    fontSize: 12,
    fontWeight: '400',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 16,
    fontWeight: '800',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
  },
  removeBtn: {
    padding: 4,
  },
  removeBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryCard: {
    padding: Spacing.four,
    borderRadius: 16,
    marginTop: Spacing.three,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.three,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  bottomPriceInfo: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 12,
  },
  bottomTotalPrice: {
    fontSize: 20,
    fontWeight: '900',
  },
  checkoutBtn: {
    width: 180,
  },
});
