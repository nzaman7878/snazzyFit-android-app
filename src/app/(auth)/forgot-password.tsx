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
import { authService } from '@/services/api/authService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleForgotPassword = async () => {
    setErrorMessage('');
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (error: any) {
      const msg = error?.message || 'Failed to send reset link. Please try again.';
      setErrorMessage(msg);
      Alert.alert('Error', msg);
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
            <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Enter your registered email and we will send you password reset instructions.
            </Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {submitted ? (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>Check Your Inbox</Text>
              <Text style={styles.successText}>
                We have dispatched password reset instructions to {email}. Follow the instructions
                in the email to set a new password.
              </Text>
              <Button
                title="Back to Sign In"
                onPress={() => router.replace('/(auth)/login')}
                variant="outline"
                style={styles.backButton}
              />
            </View>
          ) : (
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

              <Button
                title="Send Reset Instructions"
                onPress={handleForgotPassword}
                loading={loading}
                style={styles.submitButton}
              />

              <View style={styles.footer}>
                <Link href="/(auth)/login" style={styles.backLink}>
                  Return to Sign In
                </Link>
              </View>
            </View>
          )}
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
    fontSize: 26,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: Spacing.two,
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
    marginTop: Spacing.two,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  backLink: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: '#ECFDF5',
    padding: Spacing.four,
    borderRadius: 12,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: Spacing.two,
  },
  successText: {
    fontSize: 14,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.four,
  },
  backButton: {
    width: '100%',
  },
});
