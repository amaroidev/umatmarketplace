import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

import {
  LoginScreen,
  RegisterScreen,
  HomeScreen,
  ProductsScreen,
  ProductDetailScreen,
  SavedScreen,
  ProfileScreen,
  OrdersScreen,
  ConversationListScreen,
  NotificationsScreen,
  ChatScreen,
  OrderDetailScreen,
  CreateListingScreen,
  ProfileEditScreen,
  SellerAnalyticsScreen,
  MyListingsScreen,
  SettingsScreen,
  SellerOnboardingScreen,
} from '../screens';
import { navigationRef } from './navigationRef';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Products stack ────────────────────────────────────────────────────────────
const ProductsStack = createNativeStackNavigator();
const ProductsStackScreen = () => (
  <ProductsStack.Navigator initialRouteName="ProductsHome" screenOptions={{ headerShown: false }}>
    <ProductsStack.Screen name="ProductsHome" component={ProductsScreen} />
    <ProductsStack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ headerShown: true, title: 'Product Details', headerBackTitle: 'Back' }}
    />
  </ProductsStack.Navigator>
);

// ── Messages stack ────────────────────────────────────────────────────────────
const MessagesStack = createNativeStackNavigator();
const MessagesStackScreen = () => (
  <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
    <MessagesStack.Screen name="ConversationList" component={ConversationListScreen} />
    <MessagesStack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ headerShown: true, headerBackTitle: 'Back' }}
    />
  </MessagesStack.Navigator>
);

// ── Seller tools stack ────────────────────────────────────────────────────────
const SellerStack = createNativeStackNavigator();
const SellerStackScreen = () => (
  <SellerStack.Navigator initialRouteName="CreateListing" screenOptions={{ headerShown: false }}>
    <SellerStack.Screen
      name="CreateListing"
      component={CreateListingScreen}
      options={{ headerShown: true, title: 'New Listing', headerBackTitle: 'Back' }}
    />
    <SellerStack.Screen name="MyListings" component={MyListingsScreen} />
    <SellerStack.Screen
      name="SellerAnalytics"
      component={SellerAnalyticsScreen}
      options={{ headerShown: true, title: 'Seller Analytics', headerBackTitle: 'Back' }}
    />
  </SellerStack.Navigator>
);

// ── Orders stack ──────────────────────────────────────────────────────────────
const OrdersStack = createNativeStackNavigator();
const OrdersStackScreen = () => (
  <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
    <OrdersStack.Screen name="OrdersList" component={OrdersScreen} />
    <OrdersStack.Screen
      name="OrderDetail"
      component={OrderDetailScreen}
      options={{ headerShown: true, title: 'Order Details', headerBackTitle: 'Back' }}
    />
  </OrdersStack.Navigator>
);

// ── Profile stack ─────────────────────────────────────────────────────────────
const ProfileStack = createNativeStackNavigator();
const ProfileStackScreen = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
    <ProfileStack.Screen
      name="ProfileEdit"
      component={ProfileEditScreen}
      options={{ headerShown: true, title: 'Edit Profile', headerBackTitle: 'Back' }}
    />
    <ProfileStack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ headerShown: true, title: 'Settings', headerBackTitle: 'Back' }}
    />
    <ProfileStack.Screen
      name="SellerOnboarding"
      component={SellerOnboardingScreen}
      options={{ headerShown: true, title: 'Seller Onboarding', headerBackTitle: 'Back' }}
    />
    <ProfileStack.Screen
      name="SavedItems"
      component={SavedScreen}
      options={{ headerShown: true, title: 'Saved Items', headerBackTitle: 'Back' }}
    />
    <ProfileStack.Screen
      name="Orders"
      component={OrdersScreen}
      options={{ headerShown: true, title: 'Orders', headerBackTitle: 'Back' }}
    />
    <ProfileStack.Screen
      name="OrderDetail"
      component={OrderDetailScreen}
      options={{ headerShown: true, title: 'Order Details', headerBackTitle: 'Back' }}
    />
    <ProfileStack.Screen
      name="Alerts"
      component={NotificationsScreen}
      options={{ headerShown: true, title: 'Alerts', headerBackTitle: 'Back' }}
    />
    <ProfileStack.Screen
      name="MessagesCenter"
      component={ConversationListScreen}
      options={{ headerShown: true, title: 'Messages', headerBackTitle: 'Back' }}
    />
    <ProfileStack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ headerShown: true, headerBackTitle: 'Back' }}
    />
  </ProfileStack.Navigator>
);

// ── Bottom tabs ───────────────────────────────────────────────────────────────
const tabIcon = (name: React.ComponentProps<typeof Ionicons>['name']) =>
  ({ color }: { color: string }) => <Ionicons name={name} size={19} color={color} />;

const MainTabs = ({ role }: { role?: string }) => (
  // Keep equal tab widths by role count.
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.text,
      tabBarInactiveTintColor: '#9f9382',
      tabBarStyle: {
        borderTopColor: colors.border,
        backgroundColor: '#fffdf8',
        height: 62,
        paddingTop: 2,
        paddingBottom: 4,
        paddingHorizontal: 0,
      },
      tabBarLabelStyle: {
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 0,
      },
      tabBarItemStyle: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 0,
      },
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeScreen}
      options={{ title: 'Home', tabBarIcon: tabIcon('home-outline') }}
    />
    <Tab.Screen
      name="ProductsTab"
      component={ProductsStackScreen}
      options={{ title: 'Browse', tabBarIcon: tabIcon('grid-outline') }}
    />
    <Tab.Screen
      name="MessagesTab"
      component={MessagesStackScreen}
      options={{ title: 'Chat', tabBarIcon: tabIcon('chatbubble-ellipses-outline') }}
    />
    {(role === 'seller' || role === 'admin') && (
      <Tab.Screen
        name="SellerTab"
        component={SellerStackScreen}
        options={{ title: 'Sell', tabBarIcon: tabIcon('storefront-outline') }}
      />
    )}
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStackScreen}
      options={{ title: 'Me', tabBarIcon: tabIcon('person-outline') }}
    />
  </Tab.Navigator>
);

// ── Root navigator ────────────────────────────────────────────────────────────
const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main">
            {() => <MainTabs role={user?.role} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
