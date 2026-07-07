import { registerUser } from '../services/authService';
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

interface SignupScreenProps {
  navigation: any;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      alert('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }
    setLoading(true);
    try {
      await registerUser(fullName, email, password);
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    } catch (e: any) {
      alert(e.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBg}>
          <LinearGradient
            colors={['#8B5CF6', '#A78BFA']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View
              style={[styles.headerContent, { transform: [{ translateY: slideAnim }], opacity: fadeAnim }]}
            >
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <View style={styles.logoContainer}>
                <Text style={styles.logo}>🐾</Text>
              </View>
              <Text style={styles.headerTitle}>Join PawPal</Text>
              <Text style={styles.headerSubtitle}>Create your account today</Text>
            </Animated.View>
          </LinearGradient>
        </View>

        <Animated.View
          style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={COLORS.textMuted}
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔐</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.toggleBtn}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>At least 8 characters</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔐</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor={COLORS.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Text style={styles.toggleBtn}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.termsCheckContainer}>
            <Switch
              value={agreeTerms}
              onValueChange={setAgreeTerms}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={agreeTerms ? COLORS.primary : '#f4f3f4'}
              disabled={loading}
            />
            <View style={styles.termsTextContainer}>
              <Text style={styles.termsCheckText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>

          <LinearGradient
            colors={['#8B5CF6', '#A78BFA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.signupButton}
          >
            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              style={styles.signupButtonInner}
            >
              <Text style={styles.signupButtonText}>
                {loading ? '⏳ Creating Account...' : '✓ Create Account'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingHorizontal: 16 },
  headerBg: { marginHorizontal: -16, marginBottom: 30 },
  headerGradient: { paddingVertical: 40, paddingHorizontal: 16, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { alignItems: 'center' },
  backButton: { alignSelf: 'flex-start', marginBottom: 16 },
  backButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  logoContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logo: { fontSize: 40 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  formContainer: { marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 2 },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 14, color: COLORS.text },
  toggleBtn: { fontSize: 16, paddingHorizontal: 8 },
  helperText: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
  termsCheckContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, paddingVertical: 8 },
  termsTextContainer: { flex: 1, marginLeft: 12 },
  termsCheckText: { fontSize: 13, color: COLORS.textSub, lineHeight: 18 },
  termsLink: { fontWeight: '600', color: COLORS.primary },
  signupButton: { borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  signupButtonInner: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  signupButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loginText: { fontSize: 14, color: COLORS.textSub },
  loginLink: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
});