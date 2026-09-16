import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/api/orderService';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { Order } from '@/types/order';

export default function OrdersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  const {
    data: orders = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<Order[]>({
    queryKey: ['user', 'orders'],
    queryFn: () => orderService.getUserOrders(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Sign In Required</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Please sign in to view your orders and track shipping status.
        </Text>
        <Button
          title="Sign In"
          onPress={() => router.push('/(auth)/login')}
          style={styles.actionBtn}
        />
      </SafeAreaView>
    );
  }

  if (isLoading && orders.length === 0) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading your orders...
        </Text>
      </SafeAreaView>
    );
  }

  if (orders.length === 0) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={[styles.title, { color: theme.text }]}>No Orders Found</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          You haven't placed any orders yet. Check out our store and grab your favorite styles!
        </Text>
        <Button
          title="Start Shopping"
          onPress={() => router.push('/explore' as any)}
          style={styles.actionBtn}
        />
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return '#16A34A';
      case 'shipped':
      case 'out for delivery':
        return '#2563EB';
      case 'packing':
        return '#D97706';
      default:
        return '#64748B';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Orders ({orders.length})</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />
        }>
        {orders.map((order) => {
          const dateStr = order.date
            ? new Date(order.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : 'Recent';

          const statusColor = getStatusColor(order.status);

          return (
            <View
              key={order._id}
              style={[styles.orderCard, { backgroundColor: theme.backgroundElement }]}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View>
                  <Text style={[styles.orderIdText, { color: theme.textSecondary }]}>
                    ID: #{order._id.slice(-8).toUpperCase()}
                  </Text>
                  <Text style={[styles.orderDateText, { color: theme.textSecondary }]}>
                    {dateStr}
                  </Text>
                </View>

                {/* Status Pill */}
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: `${statusColor}15` },
                  ]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {order.status || 'Order Placed'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.background }]} />

              {/* Items Summary */}
              <View style={styles.itemsList}>
                {order.items &&
                  order.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                        • {item.name} (Size: {item.size})
                      </Text>
                      <Text style={[styles.itemQtyPrice, { color: theme.textSecondary }]}>
                        x{item.quantity} - ₹{item.price * item.quantity}
                      </Text>
                    </View>
                  ))}
              </View>

              <View style={[styles.divider, { backgroundColor: theme.background }]} />

              {/* Order Footer */}
              <View style={styles.orderFooter}>
                <Text style={[styles.paymentMethodText, { color: theme.textSecondary }]}>
                  Payment: {order.paymentMethod} ({order.payment ? 'Paid' : 'Pending'})
                </Text>
                <Text style={[styles.orderTotalText, { color: theme.text }]}>
                  Total: <Text style={{ color: '#2563EB' }}>₹{order.amount}</Text>
                </Text>
              </View>
            </View>
          );
        })}
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
  emptyIcon: {
    fontSize: 60,
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
  orderCard: {
    borderRadius: 16,
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '700',
  },
  orderDateText: {
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.three,
  },
  itemsList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    marginRight: Spacing.two,
  },
  itemQtyPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 12,
  },
  orderTotalText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
