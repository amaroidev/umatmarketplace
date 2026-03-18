import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { getRedirectUrl, makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import AppAlert from '../components/AppAlert';
import { colors } from '../theme';
import { supabase } from '../services/supabase';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '904520092449-gnrmhr6h0ltvf74uqdh0s3pcflalljji.apps.googleusercontent.com';
const GOOGLE_EXPO_CLIENT_ID = '904520092449-ph2so1ap5n2pgpqahclig9gmvar4k51m.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '335270104690-675e2r90uuv9ftplbofkmbndmbs1mngk.apps.googleusercontent.com';
const isExpoGo = Constants.appOwnership === 'expo';

const getExpoRedirectUri = () => {
  try {
    return getRedirectUrl('redirect');
  } catch {
    return makeRedirectUri({ path: 'redirect' });
  }
};

const RegisterScreen = ({ navigation }: any) => {
  const { register, googleLogin } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '' as '' | 'buyer' | 'seller',
    studentId: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alertState, setAlertState] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: isExpoGo ? GOOGLE_WEB_CLIENT_ID : GOOGLE_EXPO_CLIENT_ID,
    ...(isExpoGo ? {} : { iosClientId: GOOGLE_IOS_CLIENT_ID }),
    webClientId: GOOGLE_WEB_CLIENT_ID,
    selectAccount: true,
    redirectUri: isExpoGo ? getExpoRedirectUri() : undefined,
  });

  React.useEffect(() => {
    const runGoogle = async () => {
      if (response?.type === 'error') {
        const message =
          response.error?.message ||
          response.params?.error_description ||
          response.params?.error ||
          'Google sign-up failed';
        setAlertState({ visible: true, title: 'Google sign-up failed', message });
        return;
      }

      if (response?.type !== 'success') return;

      if (response.params?.error) {
        const message = response.params.error_description || response.params.error;
        setAlertState({ visible: true, title: 'Google sign-up failed', message });
        return;
      }

      const credential = response.params.id_token;
      if (!credential || !form.role) return;

      setIsLoading(true);
      try {
        const { data: authData, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credential,
        });

        const accessToken = authData.session?.access_token;
        if (error || !accessToken) {
          throw new Error(error?.message || 'Supabase Google session failed.');
        }

        await googleLogin(accessToken, form.role);
      } catch (error: any) {
        const message = error.response?.data?.message || error.userMessage || error.message || 'Google sign-up failed';
        setAlertState({ visible: true, title: 'Google sign-up failed', message });
      } finally {
        setIsLoading(false);
      }
    };
    runGoogle();
  }, [response]);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isRoleChosen = useMemo(() => form.role === 'buyer' || form.role === 'seller', [form.role]);

  const goToPasswordStep = () => {
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim().toLowerCase();
    const trimmedPhone = form.phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setAlertState({
        visible: true,
        title: 'Missing details',
        message: 'Name, email and phone are required before continuing.',
      });
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setAlertState({
        visible: true,
        title: 'Invalid email',
        message: 'Enter a valid email address before continuing.',
      });
      return;
    }

    setForm((prev) => ({
      ...prev,
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      studentId: prev.studentId.trim(),
      location: prev.location.trim(),
    }));

    setStep(3);
  };

  const handleRegister = async () => {
    const normalized = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      studentId: form.studentId.trim(),
      location: form.location.trim(),
    };

    if (!normalized.name || !normalized.email || !normalized.phone || !normalized.password || !isRoleChosen) {
      setAlertState({ visible: true, title: 'Missing fields', message: 'Role, name, email, phone and password are required.' });
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(normalized.email)) {
      setAlertState({ visible: true, title: 'Invalid email', message: 'Please enter a valid email address.' });
      return;
    }

    if (normalized.password.length < 6) {
      setAlertState({ visible: true, title: 'Weak password', message: 'Password must be at least 6 characters.' });
      return;
    }
    if (normalized.password !== normalized.confirmPassword) {
      setAlertState({ visible: true, title: 'Password mismatch', message: 'Passwords do not match.' });
      return;
    }

    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = normalized;
      await register({ ...registerData, password: normalized.password } as any);
    } catch (error: any) {
      const message = error.response?.data?.message || error.userMessage || error.message || 'Registration failed';
      setAlertState({ visible: true, title: 'Registration failed', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGooglePress = () => {
    if (!isRoleChosen) {
      setAlertState({ visible: true, title: 'Choose role first', message: 'Select Buy or Sell before continuing with Google.' });
      return;
    }
    promptAsync();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.heroWrap}>
            <Text style={styles.eyebrow}>Create account</Text>
            <Text style={styles.title}>Join Marketplace</Text>
            <Text style={styles.subtitle}>
              {step === 1 && 'Step 1: choose your role.'}
              {step === 2 && 'Step 2: add your details.'}
              {step === 3 && 'Step 3: secure your account.'}
            </Text>
            <View style={styles.stepDots}>
              {[1, 2, 3].map((s) => (
                <View key={s} style={[styles.stepDot, step >= (s as 1 | 2 | 3) && styles.stepDotActive]} />
              ))}
            </View>
            <Image source={require('../../assets/marketillustration2.jpg')} style={styles.heroArt} />
          </View>

          <View style={styles.form}>
            {step === 1 ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>I want to</Text>
                    <View style={styles.roleContainer}>
                      <TouchableOpacity style={[styles.roleButton, form.role === 'buyer' && styles.roleButtonActive]} onPress={() => updateForm('role', 'buyer')}>
                        <Text style={[styles.roleText, form.role === 'buyer' && styles.roleTextActive]}>Buy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.roleButton, form.role === 'seller' && styles.roleButtonActive]} onPress={() => updateForm('role', 'seller')}>
                        <Text style={[styles.roleText, form.role === 'seller' && styles.roleTextActive]}>Sell</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity style={[styles.button, !isRoleChosen && styles.buttonDisabled]} onPress={() => isRoleChosen && setStep(2)} disabled={!isRoleChosen}>
                    <Text style={styles.buttonText}>Continue with Email</Text>
                  </TouchableOpacity>

                  <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.divider} />
                  </View>

                  <Pressable onPress={handleGooglePress} disabled={isLoading || !request} style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.85 }, (!isRoleChosen || !request || isLoading) && { opacity: 0.45 }]}>
                    {isLoading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.googleBtnText}>Continue with Google</Text>}
                  </Pressable>
                </>
              ) : step === 2 ? (
                <>
                  {[
                    ['Full Name *', 'name', 'Kwame Asante'],
                    ['Email *', 'email', 'you@umat.edu.gh'],
                    ['Phone Number *', 'phone', '0XX XXX XXXX'],
                    ['Student ID (Optional)', 'studentId', 'Your UMaT student ID'],
                    ['Location on Campus (Optional)', 'location', 'e.g. Jubilee Hostel, Esaase'],
                  ].map(([label, key, placeholder]) => (
                    <View style={styles.inputGroup} key={key}>
                      <Text style={styles.label}>{label}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={placeholder}
                        placeholderTextColor="#9a8e7f"
                        value={(form as any)[key]}
                        onChangeText={(v: string) => updateForm(key, v)}
                        keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'}
                        autoCapitalize={key === 'email' ? 'none' : 'sentences'}
                      />
                    </View>
                  ))}

                  <View style={styles.rowActions}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
                      <Text style={styles.secondaryBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={goToPasswordStep}>
                      <Text style={styles.buttonText}>Continue</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password *</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="At least 6 characters"
                        placeholderTextColor="#9a8e7f"
                        value={form.password}
                        onChangeText={(v) => updateForm('password', v)}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((prev) => !prev)}>
                        <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password *</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Re-enter your password"
                        placeholderTextColor="#9a8e7f"
                        value={form.confirmPassword}
                        onChangeText={(v) => updateForm('confirmPassword', v)}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword((prev) => !prev)}>
                        <Text style={styles.eyeText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.rowActions}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(2)}>
                      <Text style={styles.secondaryBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled, { flex: 1 }]} onPress={handleRegister} disabled={isLoading}>
                      <Text style={styles.buttonText}>{isLoading ? 'Creating account...' : 'Create account'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.link}>Login</Text>
                </TouchableOpacity>
              </View>
          </View>
        </ScrollView>

        <AppAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          onClose={() => setAlertState({ visible: false, title: '', message: '' })}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 18 },
  heroWrap: { marginBottom: 16 },
  eyebrow: { color: '#8f806d', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '800' },
  title: { marginTop: 8, color: '#1f1a14', fontSize: 34, fontWeight: '900', textTransform: 'uppercase' },
  subtitle: { marginTop: 6, color: '#7b6f61', fontSize: 13, lineHeight: 20 },
  stepDots: { flexDirection: 'row', gap: 6, marginTop: 8 },
  stepDot: { width: 16, height: 3, backgroundColor: '#e3d7c3' },
  stepDotActive: { backgroundColor: '#2f5d4f' },
  heroArt: { marginTop: 14, width: '100%', height: 160, borderWidth: 1, borderColor: '#ddcfb8' },
  form: { backgroundColor: '#fffdf8', borderWidth: 1, borderColor: '#dccfb8', padding: 20, marginBottom: 24 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '800', color: '#6f6559', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.2 },
  input: { borderWidth: 1, borderColor: '#ddcfb8', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1f1a14', backgroundColor: '#fff' },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 60 },
  eyeButton: { position: 'absolute', right: 12, top: 13 },
  eyeText: { color: '#2f5d4f', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  roleContainer: { flexDirection: 'row', gap: 12 },
  roleButton: { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#ddcfb8', alignItems: 'center', backgroundColor: '#fff' },
  roleButtonActive: { borderColor: '#2f5d4f', backgroundColor: '#edf3ef' },
  roleText: { fontSize: 12, fontWeight: '800', color: '#7f7467', textTransform: 'uppercase', letterSpacing: 1.2 },
  roleTextActive: { color: '#2f5d4f' },
  button: { backgroundColor: '#1f1a14', paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 10 },
  divider: { flex: 1, height: 1, backgroundColor: '#ddcfb8' },
  dividerText: { marginHorizontal: 8, color: '#9a8e7f', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: '700' },
  googleBtn: { borderWidth: 1, borderColor: '#c8b89f', paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  googleBtnText: { color: '#1f1a14', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 },
  rowActions: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  secondaryBtn: { borderWidth: 1, borderColor: '#ddcfb8', paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#fff' },
  secondaryBtnText: { color: '#5f5447', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 13, color: '#7f7467' },
  link: { fontSize: 13, color: '#2f5d4f', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
});

export default RegisterScreen;
