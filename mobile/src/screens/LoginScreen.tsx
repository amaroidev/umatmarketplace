import React, { useState } from 'react';
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
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuth } from '../context/AuthContext';
import AppAlert from '../components/AppAlert';
import { colors } from '../theme';
import { supabase } from '../services/supabase';

WebBrowser.maybeCompleteAuthSession();

const extractOAuthParams = (redirectUrl: string) => {
  const result: Record<string, string> = {};
  try {
    const url = new URL(redirectUrl);
    const query = new URLSearchParams(url.search);
    query.forEach((value, key) => {
      result[key] = value;
    });

    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
    const fragment = new URLSearchParams(hash);
    fragment.forEach((value, key) => {
      result[key] = value;
    });
  } catch {
    const [, queryPart = ''] = redirectUrl.split('?');
    const [queryOnly = '', hashPart = ''] = queryPart.split('#');
    const query = new URLSearchParams(queryOnly);
    query.forEach((value, key) => {
      result[key] = value;
    });
    const fragment = new URLSearchParams(hashPart);
    fragment.forEach((value, key) => {
      result[key] = value;
    });
  }

  return result;
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

  const handleGooglePress = async () => {
    setIsLoading(true);
    try {
      const redirectTo = makeRedirectUri({ scheme: 'campusmarketplace', path: 'auth/callback' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { prompt: 'select_account' },
        },
      });

      if (error || !data?.url) {
        throw new Error(error?.message || 'Unable to start Google sign-in.');
      }

      const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (authResult.type !== 'success' || !authResult.url) {
        if (authResult.type === 'cancel') return;
        throw new Error('Google sign-in did not complete.');
      }

      const parsed = Linking.parse(authResult.url);
      const params = {
        ...extractOAuthParams(authResult.url),
        ...(parsed.queryParams as Record<string, string | undefined> | undefined),
      };

      const code = typeof params.code === 'string' ? params.code : undefined;
      let accessToken: string | undefined;

      if (code) {
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        accessToken = exchangeData.session?.access_token;
        if (exchangeError || !accessToken) {
          throw new Error(exchangeError?.message || 'Supabase Google session failed.');
        }
      } else {
        const oauthAccessToken = typeof params.access_token === 'string' ? params.access_token : undefined;
        const oauthRefreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : undefined;

        if (!oauthAccessToken || !oauthRefreshToken) {
          throw new Error('Missing OAuth code/tokens from Google redirect.');
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: oauthAccessToken,
          refresh_token: oauthRefreshToken,
        });

        accessToken = sessionData.session?.access_token;
        if (sessionError || !accessToken) {
          throw new Error(sessionError?.message || 'Supabase session setup failed.');
        }
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
                onPress={handleGooglePress}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.googleBtn,
                  pressed && { opacity: 0.85 },
                  isLoading && { opacity: 0.5 },
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
