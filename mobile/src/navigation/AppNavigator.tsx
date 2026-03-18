import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Text, View } from 'react-native';
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
} from '../screens';
import { navigationRef } from './navigationRef';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Products stack ────────────────────────────────────────────────────────────
const ProductsStack = createNativeStackNavigator();
const ProductsStackScreen = () => (
  <ProductsStack.Navigator screenOptions={{ headerShown: false }}>
    <ProductsStack.Screen name="ProductsHome" component={ProductsScreen} />
    <ProductsStack.Screen name="HomeShowcase" component={HomeScreen} />
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
      name="CreateListing"
      component={CreateListingScreen}
      options={{ headerShown: true, title: 'New Listing', headerBackTitle: 'Back' }}
    />
    <ProfileStack.Screen
      name="SellerAnalytics"
      component={SellerAnalyticsScreen}
      options={{ headerShown: true, title: 'Seller Analytics', headerBackTitle: 'Back' }}
    />
    <ProfileStack.Screen
      name="MyListings"
      component={MyListingsScreen}
      options={{ headerShown: true, title: 'My Listings', headerBackTitle: 'Back' }}
    />
  </ProfileStack.Navigator>
);

// ── Bottom tabs ───────────────────────────────────────────────────────────────
const tabIcon = (emoji: string) =>
  ({ color }: { color: string }) => (
    <Text style={{ fontSize: 18, color }}>{emoji}</Text>
  );

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.text,
      tabBarInactiveTintColor: '#9f9382',
      tabBarStyle: {
        borderTopColor: colors.border,
        backgroundColor: '#fffdf8',
        height: 64,
        paddingTop: 5,
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
      },
    }}
  >
    <Tab.Screen
      name="ProductsTab"
      component={ProductsStackScreen}
      options={{ title: 'Browse', tabBarIcon: tabIcon('🏠') }}
    />
    <Tab.Screen
      name="Saved"
      component={SavedScreen}
      options={{ title: 'Saved', tabBarIcon: tabIcon('🔖') }}
    />
    <Tab.Screen
      name="MessagesTab"
      component={MessagesStackScreen}
      options={{ title: 'Messages', tabBarIcon: tabIcon('💬') }}
    />
    <Tab.Screen
      name="OrdersTab"
      component={OrdersStackScreen}
      options={{ title: 'Orders', tabBarIcon: tabIcon('📦') }}
    />
    <Tab.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ title: 'Alerts', tabBarIcon: tabIcon('🔔') }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStackScreen}
      options={{ title: 'Profile', tabBarIcon: tabIcon('👤') }}
    />
  </Tab.Navigator>
);

// ── Root navigator ────────────────────────────────────────────────────────────
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

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
          <Stack.Screen name="Main" component={MainTabs} />
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
