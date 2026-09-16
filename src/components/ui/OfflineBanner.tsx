import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';

export function OfflineBanner() {
  const netInfo = useNetInfo();

  // If connected is not explicitly false (null during initial detection or true), don't show
  if (netInfo.isConnected !== false) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.text}>No internet connection. Showing cached data.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    zIndex: 9999,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
