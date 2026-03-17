import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    if (import.meta.env.DEV) {
      const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
      await Promise.all(registrations.map((registration) => registration.unregister())).catch(() => {});
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore registration errors in unsupported contexts.
    });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppRoot: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '904520092449-gnrmhr6h0ltvf74uqdh0s3pcflalljji.apps.googleusercontent.com'}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SocketProvider>
              <App />
              <Toaster
                position={isMobile ? 'bottom-center' : 'bottom-right'}
                toastOptions={{
                  duration: 1800,
                  style: {
                    borderRadius: '0px',
                    background: '#f6f1e7',
                    color: '#2c2418',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    border: '1px solid #dccfb8',
                    boxShadow: 'none',
                    padding: '10px 12px',
                  },
                  success: {
                    style: {
                      borderColor: '#93a77a',
                      background: '#edf3e6',
                      color: '#2d3b1f',
                    },
                    iconTheme: {
                      primary: '#5f7a3f',
                      secondary: '#edf3e6',
                    },
                  },
                  error: {
                    style: {
                      borderColor: '#e2a8a2',
                      background: '#fceceb',
                      color: '#6b221c',
                    },
                    iconTheme: {
                      primary: '#c0392b',
                      secondary: '#fceceb',
                    },
                  },
                }}
              />
            </SocketProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
