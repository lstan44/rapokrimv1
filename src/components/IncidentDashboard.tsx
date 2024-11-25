import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { useLocationState } from '../contexts/LocationStateContext';
import { Map, List, Twitter } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import IncidentList from './IncidentList';
import IncidentMap from './IncidentMap';
import ReportIncidentModal from './ReportIncidentModal';
import ReportButton from './ReportButton';
import AuthModal from './auth/AuthModal';
import Header from './Header';
import type { Incident, IncidentCreate } from '../types';
import { createIncident } from '../services/incidents';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../lib/logger';
import { toast } from './ui/use-toast';
import { useMapBounds } from '../hooks/useMapBounds';
import { useGeolocation } from '../hooks/useGeolocation';
import { fetchIncidents } from '../services/incidents';

interface IncidentDashboardProps {
  incidents: Incident[];
  isLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
}

export default memo(function IncidentDashboard({ 
  incidents: initialIncidents, 
  isLoading: initialLoading, 
  userLocation 
}: IncidentDashboardProps) {
  const { currentLocation: coordinates, error: locationError } = useLocationState();
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const location = useLocationState();
  const focusLocation = location.state?.focusLocation || null;
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { bounds, updateBounds, isLoading } = useMapBounds();

  const effectiveLocation = useMemo(() => 
    coordinates || userLocation
  , [coordinates, userLocation]);

  const queryConfig = useMemo(() => ({
    queryKey: ['incidents', bounds],
    queryFn: async () => {
      if (!bounds) {
        console.log('❌ No bounds available');
        return [];
      }
      console.log('🔍 Fetching incidents with bounds:', bounds);
      return fetchIncidents(bounds);
    },
    enabled: !!bounds,
    staleTime: 1000 * 60,
    cacheTime: 1000 * 60 * 5
  }), [bounds]);

  const { data: incidents = [] } = useQuery(queryConfig);

  const memoizedIncidents = useMemo(() => incidents, [incidents]);

  useEffect(() => {
    if (coordinates && !hasRequestedLocation) {
      setHasRequestedLocation(true);
      // Trigger initial data fetch with location
      queryClient.invalidateQueries(['incidents', 'bounds']);
    }
  }, [coordinates, hasRequestedLocation, queryClient]);

  const handleReportClick = useCallback(() => {
    logger.info('Report button clicked', 'user_interaction');
    if (user) {
      setIsReportModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  }, [user]);

  const handleAuthModalClose = useCallback(() => {
    setIsAuthModalOpen(false);
    if (user) {
      setIsReportModalOpen(true);
    }
  }, [user]);

  const handleSubmitReport = useCallback(async (newIncident: IncidentCreate) => {
    try {
      await createIncident(newIncident);
      await queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setIsReportModalOpen(false);
      
      toast({
        title: t('incident.report.success'),
        description: t('incident.report.successDetail'),
      });
    } catch (error) {
      logger.error(error, 'create_incident');
      toast({
        title: t('incident.report.error'),
        description: error instanceof Error ? error.message : t('incident.report.errorDetail'),
        variant: 'destructive',
      });
      throw error;
    }
  }, [queryClient, t]);

  const handleMenuStateChange = useCallback((isOpen: boolean) => {
    setIsMenuOpen(isOpen);
  }, []);

  const handleViewChange = useCallback((newView: string) => {
    setView(newView as 'map' | 'list');
  }, []);

  return (
    <main className="h-[100dvh] w-screen relative overflow-hidden pt-16">
      <Header 
        onAuthRequired={() => setIsAuthModalOpen(true)} 
        onMenuStateChange={handleMenuStateChange} 
      />

      {/* Floating UI Elements - hidden when menu is open */}
      {!isMenuOpen && !isReportModalOpen && (
        <>
          <div className="fixed top-16 left-0 right-0 z-20 bg-gradient-to-b from-white/90 to-white/0 pt-4 pb-8 px-4">
            <div className="flex items-center justify-center max-w-screen-xl mx-auto">
              <Tabs value={view} onValueChange={handleViewChange}>
                <TabsList className="max-w-[200px]">
                  <TabsTrigger value="map" className="flex-1">
                    <Map className="w-4 h-4 mr-2" />Map
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex-1">
                    <List className="w-4 h-4 mr-2" />List
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
            <ReportButton 
              onClick={handleReportClick}
              onAuthRequired={() => setIsAuthModalOpen(true)}
            />
          </div>

          <div className="fixed bottom-6 right-6 z-20">
            <a 
              href="https://x.com/Port_au_tech" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 text-gray-600 hover:text-blue-400"
              aria-label="Follow us on X (Twitter)"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </>
      )}

      <div className="h-full w-full">
        {isLoading || initialLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : view === 'map' ? (
          <div className="h-full w-full">
            <IncidentMap 
              incidents={memoizedIncidents} 
              userLocation={effectiveLocation}
              focusLocation={focusLocation}
              zoom={18}
            />
          </div>
        ) : incidents.length === 0 ? (
          <div className="h-full flex items-center justify-center px-4">
            <div className="text-center">
              <p className="text-gray-500 mb-4">{t('incident.empty.message')}</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleReportClick}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  {t('incident.empty.reportButton')}
                </button>
                <a 
                  href="https://x.com/Port_au_tech" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-400 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto pt-24 pb-24 px-4">
            <div className="max-w-2xl mx-auto">
              <IncidentList incidents={memoizedIncidents} />
            </div>
          </div>
        )}
      </div>

      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleSubmitReport}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleAuthModalClose}
      />
    </main>
  );
});