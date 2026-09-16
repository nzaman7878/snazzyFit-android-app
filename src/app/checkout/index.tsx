import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { cartService } from '@/services/api/cartService';
import { orderService } from '@/services/api/orderService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { Address } from '@/types/auth';
import { CartCalculationResult } from '@/types/cart';

const DELIVERY_FEE = 10;

export default function CheckoutScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { cartItems, clearCart } = useCart();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);

  // New address form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [phone, setPhone] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponResult, setCouponResult] = useState<CartCalculationResult | null>(null);
  const [couponError, setCouponError] = useState('');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Razorpay'>('COD');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Set default address if available
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setSelectedAddress(defaultAddr);
    } else {
      setUseNewAddress(true);
    }
  }, [user]);

  // Handle live coupon calculation
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setApplyingCoupon(true);
    setCouponError('');
    try {
      const formattedItems = cartItems.map((item) => ({
        _id: item.itemId,
        itemId: item.itemId,
        size: item.size,
        quantity: item.quantity,
      }));

      const calculation = await cartService.calculateCart(formattedItems, couponCode.trim());
      if (calculation.couponError) {
        setCouponError(calculation.couponError);
        setCouponResult(null);
      } else {
        setCouponResult(calculation);
        Alert.alert('Coupon Applied!', `Saved ₹${calculation.couponDiscount} on this order.`);
      }
    } catch (err: any) {
      setCouponError(err?.message || 'Could not validate coupon');
      setCouponResult(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handlePlaceOrder = async () => {
    let finalAddress: Address;

    if (useNewAddress) {
      if (!street.trim() || !city.trim() || !state.trim() || !zipcode.trim() || !phone.trim()) {
        Alert.alert('Missing Address', 'Please complete all address fields.');
        return;
      }
      finalAddress = {
        id: Date.now().toString(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zipcode: zipcode.trim(),
        country: 'India',
        phone: phone.trim(),
      };
    } else {
      if (!selectedAddress) {
        Alert.alert('Select Address', 'Please choose a delivery address.');
        return;
      }
      finalAddress = selectedAddress;
    }

    const orderItems = cartItems.map((item) => ({
      _id: item.itemId,
      itemId: item.itemId,
      size: item.size,
      quantity: item.quantity,
    }));

    setSubmittingOrder(true);
    try {
      if (paymentMethod === 'COD') {
        await orderService.placeOrderCOD({
          items: orderItems,
          address: finalAddress,
          couponCode: couponResult?.couponApplied ? couponCode.trim() : undefined,
        });

        clearCart();
        router.replace('/checkout/success' as any);
      } else {
        // Razorpay order creation
        const razorpayRes = await orderService.placeOrderRazorpay({
          items: orderItems,
          address: finalAddress,
          couponCode: couponResult?.couponApplied ? couponCode.trim() : undefined,
        });

        if (razorpayRes.order) {
          Alert.alert(
            'Online Payment',
            `Razorpay order created with ID: ${razorpayRes.order.id}. For this build, COD is verified and live.`,
            [
              {
                text: 'Complete as COD',
                onPress: async () => {
                  await orderService.placeOrderCOD({
                    items: orderItems,
                    address: finalAddress,
                  });
                  clearCart();
                  router.replace('/checkout/success' as any);
                },
              },
            ]
          );
        }
      }
    } catch (err: any) {
      Alert.alert('Order Failed', err?.message || 'Could not place order. Please check stock.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const rawSubtotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );
  const couponDiscount = couponResult?.couponDiscount || 0;
  const finalPayable = Math.max(0, rawSubtotal - couponDiscount + DELIVERY_FEE);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Delivery Address Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📍 Delivery Address</Text>

          {user?.addresses && user.addresses.length > 0 && !useNewAddress ? (
            <>
              {user.addresses.map((addr) => {
                const isSelected = selectedAddress?.id === addr.id;
                return (
                  <Pressable
                    key={addr.id}
                    onPress={() => setSelectedAddress(addr)}
                    style={[
                      styles.addressCard,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: isSelected ? '#2563EB' : 'transparent',
                      },
                    ]}>
                    <View style={styles.radioCircle}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.addressDetails}>
                      <Text style={[styles.addressName, { color: theme.text }]}>
                        {addr.firstName} {addr.lastName}
                      </Text>
                      <Text style={[styles.addressText, { color: theme.textSecondary }]}>
                        {addr.street}, {addr.city}, {addr.state} - {addr.zipcode}
                      </Text>
                      <Text style={[styles.addressText, { color: theme.textSecondary }]}>
                        Phone: {addr.phone}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}

              <Pressable onPress={() => setUseNewAddress(true)} style={styles.toggleAddressBtn}>
                <Text style={styles.toggleAddressText}>+ Deliver to a different address</Text>
              </Pressable>
            </>
          ) : (
            <View style={[styles.newAddressForm, { backgroundColor: theme.backgroundElement }]}>
              {user?.addresses && user.addresses.length > 0 && (
                <Pressable onPress={() => setUseNewAddress(false)} style={{ marginBottom: 12 }}>
                  <Text style={styles.toggleAddressText}>← Choose from saved addresses</Text>
                </Pressable>
              )}
              <Input
                label="First Name"
                placeholder="John"
                value={firstName}
                onChangeText={setFirstName}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                value={lastName}
                onChangeText={setLastName}
              />
              <Input
                label="Street Address"
                placeholder="Flat 101, Main Road"
                value={street}
                onChangeText={setStreet}
              />
              <Input
                label="City"
                placeholder="Mumbai"
                value={city}
                onChangeText={setCity}
              />
              <Input
                label="State"
                placeholder="Maharashtra"
                value={state}
                onChangeText={setState}
              />
              <Input
                label="Zipcode"
                placeholder="400001"
                keyboardType="numeric"
                value={zipcode}
                onChangeText={setZipcode}
              />
              <Input
                label="Phone Number"
                placeholder="9876543210"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          )}
        </View>

        {/* Coupon Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🏷️ Promotional Coupon</Text>
          <View style={styles.couponRow}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Enter coupon (e.g. SAVE10)"
                autoCapitalize="characters"
                value={couponCode}
                onChangeText={setCouponCode}
                error={couponError}
              />
            </View>
            <Button
              title="Apply"
              onPress={handleApplyCoupon}
              loading={applyingCoupon}
              style={styles.applyCouponBtn}
            />
          </View>
          {couponResult?.couponApplied && (
            <View style={styles.couponSuccessBanner}>
              <Text style={styles.couponSuccessText}>
                ✓ Coupon {couponResult.couponApplied.code} applied! Saved ₹{couponDiscount}.
              </Text>
            </View>
          )}
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>💳 Payment Method</Text>

          <Pressable
            onPress={() => setPaymentMethod('COD')}
            style={[
              styles.paymentOption,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: paymentMethod === 'COD' ? '#2563EB' : 'transparent',
              },
            ]}>
            <View style={styles.radioCircle}>
              {paymentMethod === 'COD' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentTitle, { color: theme.text }]}>
                Cash on Delivery (COD)
              </Text>
              <Text style={[styles.paymentSubtitle, { color: theme.textSecondary }]}>
                Pay in cash upon doorstep package arrival
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setPaymentMethod('Razorpay')}
            style={[
              styles.paymentOption,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: paymentMethod === 'Razorpay' ? '#2563EB' : 'transparent',
              },
            ]}>
            <View style={styles.radioCircle}>
              {paymentMethod === 'Razorpay' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentTitle, { color: theme.text }]}>
                Online Payment (UPI, Cards, Netbanking)
              </Text>
              <Text style={[styles.paymentSubtitle, { color: theme.textSecondary }]}>
                Secure digital payment via Razorpay
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Order Breakdown */}
        <View style={[styles.breakdownCard, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.breakdownTitle, { color: theme.text }]}>Payment Breakdown</Text>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>Items Total</Text>
            <Text style={[styles.breakdownValue, { color: theme.text }]}>₹{rawSubtotal}</Text>
          </View>

          {couponDiscount > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: '#16A34A' }]}>Coupon Discount</Text>
              <Text style={[styles.breakdownValue, { color: '#16A34A' }]}>−₹{couponDiscount}</Text>
            </View>
          )}

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>
              Delivery Fee
            </Text>
            <Text style={[styles.breakdownValue, { color: theme.text }]}>₹{DELIVERY_FEE}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.background }]} />

          <View style={styles.breakdownRow}>
            <Text style={[styles.finalLabel, { color: theme.text }]}>Amount to Pay</Text>
            <Text style={[styles.finalPrice, { color: '#2563EB' }]}>₹{finalPayable}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Sticky Action */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background }]}>
        <View style={styles.bottomPriceInfo}>
          <Text style={[styles.bottomPriceLabel, { color: theme.textSecondary }]}>Total</Text>
          <Text style={[styles.bottomPriceAmount, { color: theme.text }]}>₹{finalPayable}</Text>
        </View>
        <Button
          title={paymentMethod === 'COD' ? 'Place Order (COD)' : 'Pay Now'}
          onPress={handlePlaceOrder}
          loading={submittingOrder}
          style={styles.placeOrderBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: 110,
  },
  section: {
    marginBottom: Spacing.five,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: Spacing.three,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: Spacing.two,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  addressDetails: {
    flex: 1,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
  },
  toggleAddressBtn: {
    marginTop: Spacing.two,
  },
  toggleAddressText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
  newAddressForm: {
    padding: Spacing.four,
    borderRadius: 14,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  applyCouponBtn: {
    width: 90,
    height: 50,
  },
  couponSuccessBanner: {
    backgroundColor: '#ECFDF5',
    padding: Spacing.two,
    borderRadius: 8,
    marginTop: Spacing.one,
  },
  couponSuccessText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '600',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: Spacing.two,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  paymentSubtitle: {
    fontSize: 12,
  },
  breakdownCard: {
    padding: Spacing.four,
    borderRadius: 16,
    marginTop: Spacing.two,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: Spacing.three,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two,
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  finalPrice: {
    fontSize: 20,
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
  bottomPriceLabel: {
    fontSize: 12,
  },
  bottomPriceAmount: {
    fontSize: 20,
    fontWeight: '900',
  },
  placeOrderBtn: {
    width: 190,
  },
});
