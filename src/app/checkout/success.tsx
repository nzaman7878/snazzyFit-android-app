import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Animated Success Badge */}
        <View style={styles.successCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Order Confirmed!</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Thank you for your order. We have received your purchase and dispatched a confirmation
          email with delivery details.
        </Text>

        <View style={styles.actions}>
          <Button
            title="View Order History"
            onPress={() => router.replace('/orders' as any)}
            style={styles.actionBtn}
          />
          <Button
            title="Continue Shopping"
            variant="outline"
            onPress={() => router.replace('/' as any)}
            style={styles.actionBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.six,
  },
  actions: {
    width: '100%',
    gap: Spacing.three,
  },
  actionBtn: {
    width: '100%',
  },
});
