import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      Alert.alert('Success', 'Account created successfully!');
      router.replace('/');
    } catch (error: any) {
      const msg = error?.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      Alert.alert('Registration Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Join Snazzyfit for exclusive apparel and deals
            </Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />

            <Input
              label="Email Address"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

            <Input
              label="Password (min 8 characters)"
              placeholder="Create a strong password"
              isPassword
              value={password}
              onChangeText={setPassword}
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              isPassword
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.submitButton}
            />

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <Link href="/(auth)/login" style={styles.loginLink}>
                Sign In
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  header: {
    marginBottom: Spacing.four,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: Spacing.three,
    borderRadius: 10,
    marginBottom: Spacing.three,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: Spacing.three,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  footerText: {
    fontSize: 14,
  },
  loginLink: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
});
