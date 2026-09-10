import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Mode = 'login' | 'signup';

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function HomeScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign up only
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const clearErrors = () => setErrors({});

  const switchMode = (next: Mode) => {
    setMode(next);
    clearErrors();
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (mode === 'signup' && username.trim().length < 3) {
      next.username = 'Username must be at least 3 characters.';
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
    }
    if (mode === 'signup' && confirmPassword !== password) {
      next.confirmPassword = 'Passwords do not match.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (mode === 'login') {
        // TODO: replace with real auth call
        console.log('Login attempt', { email, password });
      } else {
        // TODO: replace with real auth call
        console.log('Sign up attempt', { username, email, password });
      }
    } catch (err) {
      console.error('Auth error', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0B3D24', '#0A2A1A', '#08160F']} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Branding */}
            <View style={styles.brandingContainer}>
              <View style={styles.logoCircle}>
                <View style={styles.eightBall}>
                  <Text style={styles.eightBallText}>8</Text>
                </View>
              </View>
              <Text style={styles.title}>RACK & STAKE</Text>
              <Text style={styles.subtitle}>High-stakes 8-ball. Play for real.</Text>
            </View>

            {/* Mode toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, mode === 'login' && styles.toggleButtonActive]}
                onPress={() => switchMode('login')}
              >
                <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                  Log In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, mode === 'signup' && styles.toggleButtonActive]}
                onPress={() => switchMode('signup')}
              >
                <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form card */}
            <View style={styles.card}>
              {mode === 'signup' && (
                <FormField
                  label="Username"
                  placeholder="Choose a username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  error={errors.username}
                />
              )}

              <FormField
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                error={errors.email}
              />

              <FormField
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                error={errors.password}
                rightAction={{
                  label: showPassword ? 'Hide' : 'Show',
                  onPress: () => setShowPassword((v) => !v),
                }}
              />

              {mode === 'signup' && (
                <FormField
                  label="Confirm Password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  error={errors.confirmPassword}
                  rightAction={{
                    label: showConfirmPassword ? 'Hide' : 'Show',
                    onPress: () => setShowConfirmPassword((v) => !v),
                  }}
                />
              )}

              {mode === 'login' && (
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#08160F" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {mode === 'login' ? 'Log In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>

              {mode === 'signup' && (
                <Text style={styles.disclaimer}>
                  You must be of legal gambling age in your jurisdiction to create an account.
                  By signing up you agree to our Terms of Service and Responsible Gaming Policy.
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
              <Text style={styles.switchModeText}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.switchModeLink}>{mode === 'login' ? 'Sign Up' : 'Log In'}</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

/** Reusable labeled input with optional inline error and right-side action (e.g. show/hide). */
function FormField({
  label,
  error,
  rightAction,
  ...inputProps
}: {
  label: string;
  error?: string;
  rightAction?: { label: string; onPress: () => void };
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholderTextColor="#6B8A76"
          {...inputProps}
        />
        {rightAction && (
          <TouchableOpacity style={styles.inputAction} onPress={rightAction.onPress}>
            <Text style={styles.inputActionText}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const FELT_GREEN = '#0F5132';
const GOLD = '#D4AF37';
const CARD_BG = '#0F2A1C';
const ERROR_RED = '#E5484D';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#08160F' },
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  brandingContainer: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: GOLD,
  },
  eightBall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eightBallText: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.5 },
  subtitle: { fontSize: 14, color: '#9BC4A9', marginTop: 6 },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 4,
    width: '100%',
    marginBottom: 20,
  },
  toggleButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  toggleButtonActive: { backgroundColor: FELT_GREEN },
  toggleText: { color: '#6B8A76', fontWeight: '700', fontSize: 14 },
  toggleTextActive: { color: '#FFFFFF' },
  card: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E4531',
  },
  inputGroup: { marginBottom: 16 },
  label: {
    color: '#9BC4A9',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: '#08160F',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#1E4531',
  },
  inputError: { borderColor: ERROR_RED },
  inputAction: { position: 'absolute', right: 14 },
  inputActionText: { color: GOLD, fontSize: 12, fontWeight: '700' },
  errorText: { color: ERROR_RED, fontSize: 12, marginTop: 6 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 16, marginTop: -8 },
  forgotPasswordText: { color: GOLD, fontSize: 13, fontWeight: '600' },
  primaryButton: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#08160F', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  disclaimer: { color: '#6B8A76', fontSize: 11, marginTop: 14, lineHeight: 16, textAlign: 'center' },
  switchModeText: { color: '#9BC4A9', fontSize: 14, marginTop: 20, textAlign: 'center' },
  switchModeLink: { color: GOLD, fontWeight: '700' },
});