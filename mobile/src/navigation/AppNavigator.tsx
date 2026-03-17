import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main tab screens
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SavedScreen from '../screens/SavedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ConversationListScreen from '../screens/ConversationListScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// Stack-only screens
import ChatScreen from '../screens/ChatScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import CreateListingScreen from '../screens/CreateListingScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import SellerAnalyticsScreen from '../screens/SellerAnalyticsScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import { navigationRef } from './navigationRef';

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
    <Text style={{ fontSize: 20, color }}>{emoji}</Text>
  );

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#2563eb',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { borderTopColor: '#e5e7eb' },
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
