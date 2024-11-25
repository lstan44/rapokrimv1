import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { supabase } from '../lib/supabase';
import type { Incident } from '../types';
import { logger } from '../lib/logger';
import { trackEvent, EventCategories, EventActions } from '../lib/analytics';
import { mapCache } from '../services/cache';

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

const MAX_BOUNDS_SIZE = 4;
const MIN_BOUNDS_SIZE = 0.001;
const DEBOUNCE_DELAY = 500;
const CACHE_TIME = 1000 * 60 * 5;

export function useMapBounds() {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const queryClient = useQueryClient();

  const validateBounds = useCallback((bounds: MapBounds): boolean => {
    try {
      if (!bounds || 
          typeof bounds.north !== 'number' || 
          typeof bounds.south !== 'number' || 
          typeof bounds.east !== 'number' || 
          typeof bounds.west !== 'number' ||
          isNaN(bounds.north) ||
          isNaN(bounds.south) ||
          isNaN(bounds.east) ||
          isNaN(bounds.west)) {
        return false;
      }

      if (bounds.north < -90 || bounds.north > 90 ||
          bounds.south < -90 || bounds.south > 90 ||
          bounds.east < -180 || bounds.east > 180 ||
          bounds.west < -180 || bounds.west > 180) {
        return false;
      }

      const latDiff = Math.abs(bounds.north - bounds.south);
      const lngDiff = Math.abs(bounds.east - bounds.west);

      if (latDiff > MAX_BOUNDS_SIZE || lngDiff > MAX_BOUNDS_SIZE) {
        return false;
      }

      if (latDiff < MIN_BOUNDS_SIZE || lngDiff < MIN_BOUNDS_SIZE) {
        return false;
      }

      if (bounds.south >= bounds.north) {
        return false;
      }

      if (bounds.west > bounds.east && Math.abs(bounds.east - bounds.west) < 180) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error('Bounds validation failed'), 'validate_bounds');
      return false;
    }
  }, []);

  const fetchIncidentsInBounds = useCallback(async (bounds: MapBounds): Promise<Incident[]> => {
    try {
      if (!validateBounds(bounds)) {
        throw new Error('Invalid bounds');
      }

      const startTime = performance.now();

      const { data, error } = await supabase
        .rpc('get_incidents_in_bounds', {
          max_lat: bounds.north,
          min_lat: bounds.south,
          max_lng: bounds.east,
          min_lng: bounds.west
        })
        .select(`
          *,
          incident_media (
            id,
            type,
            url
          )
        `);

      if (error) {
        throw error;
      }

      const duration = performance.now() - startTime;
      
      trackEvent(
        EventCategories.Map,
        EventActions.Pan,
        'Map bounds updated',
        data?.length
      );

      return data || [];
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error('Failed to fetch incidents'), 'fetch_incidents_bounds');
      return [];
    }
  }, [validateBounds]);

  const areBoundsSimilar = useCallback((bounds1: MapBounds, bounds2: MapBounds) => {
    const threshold = 0.0001;
    return Math.abs(bounds1.north - bounds2.north) < threshold &&
           Math.abs(bounds1.south - bounds2.south) < threshold &&
           Math.abs(bounds1.east - bounds2.east) < threshold &&
           Math.abs(bounds1.west - bounds2.west) < threshold;
  }, []);

  const updateBounds = useCallback(
    debounce(async (newBounds: MapBounds) => {
      console.log('🗺️ Updating bounds:', newBounds);
      if (!validateBounds(newBounds)) {
        console.log('❌ Invalid bounds');
        return;
      }
      
      if (bounds && areBoundsSimilar(newBounds, bounds)) {
        console.log('🔄 Bounds similar, skipping update');
        return;
      }
      
      setBounds(newBounds);
      console.log('✅ Bounds set:', newBounds);
      
      queryClient.invalidateQueries(['incidents', newBounds]);
    }, DEBOUNCE_DELAY),
    [queryClient, validateBounds, bounds, areBoundsSimilar]
  );

  return {
    bounds,
    updateBounds,
    isLoading: queryClient.getQueryData(['incidents', 'bounds', 'loading']) as boolean
  };
}