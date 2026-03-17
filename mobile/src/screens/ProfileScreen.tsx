import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      label: 'Edit Profile',
      onPress: () => navigation.navigate('ProfileEdit'),
    },
    {
      label: 'My Orders',
      onPress: () => navigation.navigate('OrdersTab'),
    },
    {
      label: 'Create Listing',
      onPress: () => navigation.navigate('CreateListing'),
      show: user?.role === 'seller' || user?.role === 'admin',
    },
    {
      label: 'My Listings',
      onPress: () => navigation.navigate('MyListings'),
      show: user?.role === 'seller' || user?.role === 'admin',
    },
    {
      label: 'Seller Analytics',
      onPress: () => navigation.navigate('SellerAnalytics'),
      show: user?.role === 'seller' || user?.role === 'admin',
    },
  ].filter((item) => item.show !== false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar / header */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Info card */}
      <View style={styles.card}>
        {user?.phone ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Phone</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        ) : null}
        {user?.location ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Location</Text>
            <Text style={styles.infoValue}>{user.location}</Text>
          </View>
        ) : null}
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Account</Text>
          <Text style={styles.infoValue}>{user?.isVerified ? 'Verified' : 'Unverified'}</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.menuItem, idx < menuItems.length - 1 && styles.menuItemBorder]}
            onPress={item.onPress}
          >
            <Text style={styles.menuItemText}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitial: { fontSize: 34, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#111827' },
  email: { marginTop: 4, fontSize: 14, color: '#6b7280' },
  roleBadge: {
    marginTop: 8,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleText: { fontSize: 10, fontWeight: '700', color: '#1e40af', letterSpacing: 1 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoKey: { fontSize: 13, color: '#6b7280' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  menu: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuItemText: { fontSize: 15, color: '#111827' },
  chevron: { fontSize: 20, color: '#d1d5db', lineHeight: 22 },
  logoutBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 13,
  },
  logoutText: { color: '#b91c1c', fontSize: 15, fontWeight: '700' },
});

export default ProfileScreen;
