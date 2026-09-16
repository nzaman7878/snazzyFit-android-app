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

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      // Redirect to main tabs upon successful login
      router.replace('/');
    } catch (error: any) {
      const msg = error?.message || 'Login failed. Please verify credentials.';
      setErrorMessage(msg);
      Alert.alert('Login Error', msg);
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
            <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Sign in to continue shopping on Snazzyfit
            </Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
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
              label="Password"
              placeholder="Enter your password"
              isPassword
              value={password}
              onChangeText={setPassword}
            />

            <View style={styles.forgotPasswordContainer}>
              <Link href="/(auth)/forgot-password" style={styles.forgotPasswordText}>
                Forgot Password?
              </Link>
            </View>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.submitButton}
            />

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <Link href="/(auth)/register" style={styles.signupLink}>
                Sign Up
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
    marginBottom: Spacing.five,
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.four,
  },
  forgotPasswordText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  footerText: {
    fontSize: 14,
  },
  signupLink: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
});
