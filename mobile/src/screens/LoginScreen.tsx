import React, { useEffect, useState } from 'react';
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

const LoginScreen = ({ navigation }: any) => {
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertState, setAlertState] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: isExpoGo ? GOOGLE_WEB_CLIENT_ID : GOOGLE_EXPO_CLIENT_ID,
    ...(isExpoGo ? {} : { iosClientId: GOOGLE_IOS_CLIENT_ID }),
    webClientId: GOOGLE_WEB_CLIENT_ID,
    selectAccount: true,
    redirectUri: isExpoGo ? getExpoRedirectUri() : undefined,
  });

  useEffect(() => {
    const runGoogle = async () => {
      if (response?.type === 'error') {
        const message =
          response.error?.message ||
          response.params?.error_description ||
          response.params?.error ||
          'Google sign-in failed';
        setAlertState({ visible: true, title: 'Google sign-in failed', message });
        return;
      }

      if (response?.type !== 'success') return;

      if (response.params?.error) {
        const message = response.params.error_description || response.params.error;
        setAlertState({ visible: true, title: 'Google sign-in failed', message });
        return;
      }

      const credential = response.params.id_token;
      if (!credential) return;

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

        const result = await googleLogin(accessToken);
        if (result?.isNewUser) {
          setAlertState({
            visible: true,
            title: 'Sign up first',
            message: 'No account found. Please sign up with Google and choose a role.',
          });
          setTimeout(() => navigation.navigate('Register'), 500);
        } else if (result?.needsProfileCompletion) {
          setAlertState({
            visible: true,
            title: 'Profile incomplete',
            message: 'Continue and update phone/store details in profile.',
          });
        }
      } catch (error: any) {
        const message = error.response?.data?.message || error.userMessage || error.message || 'Google sign-in failed';
        setAlertState({ visible: true, title: 'Google sign-in failed', message });
      } finally {
        setIsLoading(false);
      }
    };
    runGoogle();
  }, [response]);

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertState({ visible: true, title: 'Missing fields', message: 'Please fill in all fields.' });
      return;
    }

    setIsLoading(true);
    try {
      await login(email.toLowerCase(), password);
    } catch (error: any) {
      const message = error.response?.data?.message || error.userMessage || error.message || 'Login failed';
      setAlertState({ visible: true, title: 'Login failed', message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.heroWrap}>
            <Text style={styles.eyebrow}>UMaT Marketplace</Text>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue buying and selling on campus.</Text>
            <Image source={require('../../assets/marketillustration1.jpg')} style={styles.heroArt} />
          </View>

          <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@umat.edu.gh"
                  placeholderTextColor="#9a8e7f"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor="#9a8e7f"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading}>
                <Text style={styles.buttonText}>{isLoading ? 'Signing in...' : 'Login'}</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>

              <Pressable
                onPress={() => {
                  promptAsync();
                }}
                disabled={!request || isLoading}
                style={({ pressed }) => [
                  styles.googleBtn,
                  pressed && { opacity: 0.85 },
                  (!request || isLoading) && { opacity: 0.5 },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <View style={styles.googleInner}>
                    <Image source={require('../../assets/adaptive-icon.png')} style={styles.googleIcon} />
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </View>
                )}
              </Pressable>

              <View style={styles.footer}>
                <Text style={styles.footerText}>No account yet? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.link}>Sign up</Text>
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
  heroWrap: { marginBottom: 18 },
  eyebrow: { color: '#8f806d', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '800' },
  title: { marginTop: 8, color: '#1f1a14', fontSize: 34, fontWeight: '900', textTransform: 'uppercase' },
  subtitle: { marginTop: 6, color: '#7b6f61', fontSize: 13, lineHeight: 20 },
  heroArt: { marginTop: 14, width: '100%', height: 160, borderWidth: 1, borderColor: '#ddcfb8' },
  form: {
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: '#dccfb8',
    padding: 20,
  },
  inputGroup: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6f6559',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddcfb8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f1a14',
    backgroundColor: '#fff',
  },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 60 },
  eyeButton: { position: 'absolute', right: 12, top: 13 },
  eyeText: { color: '#2f5d4f', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  button: { backgroundColor: '#1f1a14', paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 10 },
  divider: { flex: 1, height: 1, backgroundColor: '#ddcfb8' },
  dividerText: { marginHorizontal: 8, color: '#9a8e7f', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: '700' },
  googleBtn: { borderWidth: 1, borderColor: '#c8b89f', paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  googleInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  googleIcon: { width: 16, height: 16 },
  googleBtnText: { color: '#1f1a14', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 13, color: '#7f7467' },
  link: { fontSize: 13, color: '#2f5d4f', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
});

export default LoginScreen;
