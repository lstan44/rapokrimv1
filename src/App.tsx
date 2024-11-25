import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/use-toast';
import { AuthProvider } from './contexts/AuthContext';
import { MapProvider } from './contexts/MapPositionContext';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './components/ErrorFallback';
import LoadingSkeleton from './components/LoadingSkeleton';
import { logger } from './lib/logger';
import { useGeolocation } from './hooks/useGeolocation';
import { LocationProvider } from './contexts/LocationStateContext';

// Lazy load components
const Header = lazy(() => import('./components/Header'));
const IncidentDashboard = lazy(() => import('./components/IncidentDashboard'));
const IncidentPage = lazy(() => import('./components/IncidentPage'));
const AuthCallback = lazy(() => import('./routes/auth/callback'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      cacheTime: 1000 * 60 * 5,
      refetchInterval: false,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      networkMode: 'online',
      suspense: false,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true
    },
  },
});

interface LocationContextType {
  userLocation: { lat: number; lng: number } | null;
  setMapView: (location: { lat: number; lng: number }) => void;
}

export const LocationContext = React.createContext<LocationContextType>({
  userLocation: null,
  setMapView: () => {},
});

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { coordinates: userLocation } = useGeolocation();
  const [hasSetInitialLocation, setHasSetInitialLocation] = useState(false);

  // Combine the two effects into one with clear conditions
  useEffect(() => {
    if (
      !userLocation ||
      location.pathname !== '/' ||
      hasSetInitialLocation ||
      location.state?.focusLocation
    ) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setHasSetInitialLocation(true);
      navigate('/', {
        state: {
          focusLocation: userLocation,
          source: 'initial-location',
        },
        replace: true,
      });
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [
    userLocation,
    location.pathname,
    hasSetInitialLocation,
    location.state?.focusLocation,
    navigate,
  ]);

  const locationContextValue = React.useMemo(() => ({
    userLocation,
    setMapView: navigate
  }), [userLocation, navigate]);

  return (
    <LocationProvider>
      <LocationContext.Provider value={locationContextValue}>
        <Suspense fallback={<LoadingSkeleton />}>
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => {
              navigate('/');
            }}
          >
            <Routes>
              <Route
                path="/"
                element={
                  <IncidentDashboard
                    incidents={[]}
                    isLoading={false}
                    userLocation={userLocation}
                  />
                }
              />
              <Route
                path="/incident/:slug"
                element={
                  <IncidentPage
                    incident={undefined}
                    onBack={() => navigate('/')}
                  />
                }
              />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </LocationContext.Provider>
    </LocationProvider>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MapProvider>
            <ToastProvider>
              <Router>
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <AppContent />
                </ErrorBoundary>
              </Router>
            </ToastProvider>
          </MapProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}