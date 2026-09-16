import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/api/userService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { Address } from '@/types/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, isAuthenticated, logout, refreshProfile } = useAuth();

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [phone, setPhone] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  const handleAddAddress = async () => {
    if (!street.trim() || !city.trim() || !state.trim() || !zipcode.trim()) {
      Alert.alert('Incomplete Address', 'Please provide street, city, state, and zipcode.');
      return;
    }

    setSavingAddress(true);
    try {
      const newAddress: Address = {
        id: Date.now().toString(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zipcode: zipcode.trim(),
        country: 'India',
        phone: phone.trim(),
        isDefault: (user?.addresses?.length || 0) === 0,
      };

      await userService.saveAddress(newAddress);
      await refreshProfile();
      setAddressModalVisible(false);
      // Reset form
      setFirstName('');
      setLastName('');
      setStreet('');
      setCity('');
      setState('');
      setZipcode('');
      setPhone('');
      Alert.alert('Success', 'Address added to your profile!');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Could not save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this delivery address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await userService.deleteAddress(id);
            await refreshProfile();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Could not delete address');
          }
        },
      },
    ]);
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loggedOutContainer}>
          <Text style={[styles.loggedOutTitle, { color: theme.text }]}>Your Account</Text>
          <Text style={[styles.loggedOutSubtitle, { color: theme.textSecondary }]}>
            Sign in to track orders, manage your delivery addresses, and sync your cart.
          </Text>
          <Button
            title="Sign In"
            onPress={() => router.push('/(auth)/login')}
            style={styles.actionBtn}
          />
          <Button
            title="Create an Account"
            variant="outline"
            onPress={() => router.push('/(auth)/register')}
            style={styles.actionBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user.name ? user.name[0].toUpperCase() : 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>{user.name}</Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user.email}</Text>
            {user.phone ? (
              <Text style={[styles.userPhone, { color: theme.textSecondary }]}>{user.phone}</Text>
            ) : null}
          </View>
        </View>

        {/* Address Book Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Delivery Addresses</Text>
            <Pressable onPress={() => setAddressModalVisible(true)}>
              <Text style={styles.addAddressText}>+ Add New</Text>
            </Pressable>
          </View>

          {user.addresses && user.addresses.length > 0 ? (
            user.addresses.map((addr) => (
              <View
                key={addr.id}
                style={[styles.addressCard, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.addressInfo}>
                  <Text style={[styles.addressName, { color: theme.text }]}>
                    {addr.firstName} {addr.lastName} {addr.isDefault && '(Default)'}
                  </Text>
                  <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
                    {addr.street}
                  </Text>
                  <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
                    {addr.city}, {addr.state} - {addr.zipcode}
                  </Text>
                  {addr.phone ? (
                    <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
                      Phone: {addr.phone}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => handleDeleteAddress(addr.id)}
                  hitSlop={10}
                  style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>Remove</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No addresses saved yet. Add one for faster checkout!
              </Text>
            </View>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Button
            title="Sign Out"
            variant="danger"
            onPress={handleLogout}
            style={styles.logoutBtn}
          />
        </View>
      </ScrollView>

      {/* Add Address Modal */}
      <Modal visible={addressModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>New Delivery Address</Text>
            <ScrollView style={styles.modalScroll}>
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
                placeholder="123 Main St, Apt 4B"
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
                label="Zip Code"
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
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setAddressModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Save Address"
                onPress={handleAddAddress}
                loading={savingAddress}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  loggedOutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  loggedOutTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  loggedOutSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.five,
  },
  actionBtn: {
    marginBottom: Spacing.three,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 16,
    marginBottom: Spacing.five,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.four,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
  },
  userPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.five,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addAddressText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
  addressCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: 12,
    marginBottom: Spacing.three,
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 13,
    lineHeight: 18,
  },
  deleteBtn: {
    paddingLeft: Spacing.two,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    padding: Spacing.four,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  logoutBtn: {
    marginTop: Spacing.two,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.three,
    textAlign: 'center',
  },
  modalScroll: {
    marginVertical: Spacing.two,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  modalBtn: {
    flex: 1,
  },
});
