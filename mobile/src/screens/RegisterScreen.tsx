import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const RegisterScreen = ({ navigation }: any) => {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'buyer' as 'buyer' | 'seller',
    studentId: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = form;
      await register(registerData);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            Campus<Text style={styles.logoAccent}>Market</Text>
          </Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.description}>Join the UMaT marketplace</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Role Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>I want to</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  form.role === 'buyer' && styles.roleButtonActive,
                ]}
                onPress={() => updateForm('role', 'buyer')}
              >
                <Text
                  style={[
                    styles.roleText,
                    form.role === 'buyer' && styles.roleTextActive,
                  ]}
                >
                  Buy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  form.role === 'seller' && styles.roleButtonActive,
                ]}
                onPress={() => updateForm('role', 'seller')}
              >
                <Text
                  style={[
                    styles.roleText,
                    form.role === 'seller' && styles.roleTextActive,
                  ]}
                >
                  Sell
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Kwame Asante"
              placeholderTextColor="#9ca3af"
              value={form.name}
              onChangeText={(v: string) => updateForm('name', v)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="you@umat.edu.gh"
              placeholderTextColor="#9ca3af"
              value={form.email}
              onChangeText={(v: string) => updateForm('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="0XX XXX XXXX"
              placeholderTextColor="#9ca3af"
              value={form.phone}
              onChangeText={(v: string) => updateForm('phone', v)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor="#9ca3af"
              value={form.password}
              onChangeText={(v: string) => updateForm('password', v)}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor="#9ca3af"
              value={form.confirmPassword}
              onChangeText={(v: string) => updateForm('confirmPassword', v)}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Student ID (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Your UMaT student ID"
              placeholderTextColor="#9ca3af"
              value={form.studentId}
              onChangeText={(v: string) => updateForm('studentId', v)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location on Campus (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Jubilee Hostel, Esaase"
              placeholderTextColor="#9ca3af"
              value={form.location}
              onChangeText={(v: string) => updateForm('location', v)}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 48 },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 28, fontWeight: '800', color: '#111827' },
  logoAccent: { color: '#2563eb' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 12 },
  description: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 32,
  },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  roleContainer: { flexDirection: 'row', gap: 12 },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  roleButtonActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  roleText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  roleTextActive: { color: '#2563eb' },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 14, color: '#6b7280' },
  link: { fontSize: 14, color: '#2563eb', fontWeight: '600' },
});

export default RegisterScreen;
