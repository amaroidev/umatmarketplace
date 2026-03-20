import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      label: 'Edit Profile',
      onPress: () => navigation.navigate('ProfileEdit'),
    },
    {
      label: 'Settings',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      label: 'My Orders',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      label: 'Saved Items',
      onPress: () => navigation.navigate('SavedItems'),
    },
    {
      label: 'Alerts',
      onPress: () => navigation.navigate('Alerts'),
    },
    {
      label: 'Messages',
      onPress: () => navigation.navigate('MessagesCenter'),
    },
  ];

  const sellerOnboardingDone = !!(user as any)?.sellerOnboarding?.completed;

  const identityName = user?.storeName || user?.brandName || user?.name;
  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader eyebrow="Account" title="Profile" subtitle="Manage account, activity, and preferences." />
      {/* Avatar / header */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{identityName}</Text>
        {(user?.storeName || user?.brandName) ? <Text style={styles.storeName}>{user?.name}</Text> : null}
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

      {isSeller ? (
        <View style={styles.sellerQuickCard}>
          {!sellerOnboardingDone ? (
            <TouchableOpacity style={styles.sellerOutlineBtn} onPress={() => navigation.navigate('SellerOnboarding')}>
              <Text style={styles.sellerOutlineText}>Complete Seller Setup</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.sellerPrimaryBtn} onPress={() => navigation.getParent()?.navigate('SellerTab', { screen: 'CreateListing' })}>
            <Text style={styles.sellerPrimaryText}>+ Sell Something</Text>
          </TouchableOpacity>
          <View style={styles.sellerQuickRow}>
            <TouchableOpacity style={styles.sellerQuickBtn} onPress={() => navigation.getParent()?.navigate('SellerTab', { screen: 'MyListings' })}>
              <Text style={styles.sellerQuickText}>My Listings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sellerQuickBtn} onPress={() => navigation.getParent()?.navigate('SellerTab', { screen: 'SellerAnalytics' })}>
              <Text style={styles.sellerQuickText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingTop: 18, paddingBottom: 24 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1f1a14',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitial: { fontSize: 34, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#111827' },
  storeName: { marginTop: 4, fontSize: 13, color: '#374151', fontWeight: '600' },
  email: { marginTop: 4, fontSize: 14, color: '#6b7280' },
  roleBadge: {
    marginTop: 8,
    backgroundColor: '#f1ebdf',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleText: { fontSize: 10, fontWeight: '700', color: '#6b5f4f', letterSpacing: 1.2 },
  card: {
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 0,
    paddingHorizontal: 16,
    marginHorizontal: 16,
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
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 0,
    marginHorizontal: 16,
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
  menuItemText: { fontSize: 13, color: '#1f1a14', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1 },
  chevron: { fontSize: 20, color: '#d1d5db', lineHeight: 22 },
  logoutBtn: {
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: '#d6b8b4',
    borderRadius: 0,
    alignItems: 'center',
    paddingVertical: 13,
  },
  logoutText: { color: '#9f3d34', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  sellerPrimaryBtn: {
    backgroundColor: colors.text,
    borderWidth: 1,
    borderColor: colors.text,
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  sellerQuickCard: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  sellerOutlineBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fffdf8',
    alignItems: 'center',
    paddingVertical: 11,
    marginBottom: 8,
  },
  sellerOutlineText: { fontSize: 11, color: '#40372d', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
  sellerQuickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sellerQuickBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fffdf8',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sellerQuickText: {
    fontSize: 11,
    color: '#463d31',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  sellerPrimaryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default ProfileScreen;
