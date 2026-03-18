import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/auth';
import { useAuth } from './context/AuthContext';

// Pages
const HomePage = lazy(() => import('./pages/Home'));
const DashboardPage = lazy(() => import('./pages/Dashboard'));
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ProfilePage from './pages/Profile';
import NotFoundPage from './pages/NotFound';
const ProductsPage = lazy(() => import('./pages/Products'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetail'));
import CreateEditProductPage from './pages/CreateEditProduct';
import MyListingsPage from './pages/MyListings';
import CategoriesPage from './pages/Categories';
import MessagesPage from './pages/Messages';
import ChatRoomPage from './pages/ChatRoom';
import CheckoutPage from './pages/Checkout';
import PaymentVerificationPage from './pages/PaymentVerification';
import OrdersPage from './pages/Orders';
import OrderDetailPage from './pages/OrderDetail';
import SellerOrdersPage from './pages/SellerOrders';
import SavedItemsPage from './pages/SavedItems';
import NotificationsPage from './pages/Notifications';
import AdminDashboardPage from './pages/AdminDashboard';
import SettingsPage from './pages/Settings';
import SellerAnalyticsPage from './pages/SellerAnalytics';
import DisputeCenterPage from './pages/DisputeCenter';
import CollectionDetailPage from './pages/CollectionDetail';
import SellerOnboardingPage from './pages/SellerOnboarding';
import AdminGrowthPage from './pages/AdminGrowth';

import { LoadingSpinner } from './components/ui';


// Redirect helpers for legacy routes
const SearchRedirect: React.FC = () => {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  return <Navigate to={`/products${q ? `?search=${encodeURIComponent(q)}` : ''}`} replace />;
};

const CategoryRedirect: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/products?category=${slug || ''}`} replace />;
};

// Root: guests → landing, logged-in → dashboard
const RootRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />;
};

const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen text="Loading page..." />}>
      <Routes>
      {/* Public routes with layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<RootRoute />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Product routes */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route
          path="/sell"
          element={
            <ProtectedRoute roles={['seller', 'admin']}>
              <CreateEditProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute roles={['seller', 'admin']}>
              <CreateEditProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-listings"
          element={
            <ProtectedRoute roles={['seller', 'admin']}>
              <MyListingsPage />
            </ProtectedRoute>
          }
        />

        {/* Order & Payment routes */}
        <Route
          path="/checkout/:productId"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/verify"
          element={
            <ProtectedRoute>
              <PaymentVerificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/orders"
          element={
            <ProtectedRoute roles={['seller', 'admin']}>
              <SellerOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/analytics"
          element={
            <ProtectedRoute roles={['seller', 'admin']}>
              <SellerAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/onboarding"
          element={
            <ProtectedRoute roles={['seller', 'admin']}>
              <SellerOnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Messaging routes */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:id"
          element={
            <ProtectedRoute>
              <ChatRoomPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect routes for backward compat */}
        <Route path="/search" element={<SearchRedirect />} />
        <Route path="/category/:slug" element={<CategoryRedirect />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/collections/:slug" element={<CollectionDetailPage />} />

        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedItemsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/disputes" element={<ProtectedRoute><DisputeCenterPage /></ProtectedRoute>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/growth"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminGrowthPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
