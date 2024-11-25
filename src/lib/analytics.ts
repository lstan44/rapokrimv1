import { logger } from './logger';

let ReactGA: any = null;

// Lazy load GA
const loadGA = async () => {
  if (!ReactGA) {
    ReactGA = (await import('react-ga4')).default;
  }
  return ReactGA;
};

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_ID;

// Initialize GA4 asynchronously
export const initGA = async () => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics Measurement ID is missing');
    return false;
  }

  try {
    const GA = await loadGA();
    GA.initialize(GA_MEASUREMENT_ID, {
      testMode: import.meta.env.MODE !== 'production',
      debug: import.meta.env.MODE !== 'production'
    });
    return true;
  } catch (error) {
    logger.error(error, 'analytics_init');
    return false;
  }
};

// Async tracking functions
export const trackPageview = async (path: string) => {
  try {
    if (GA_MEASUREMENT_ID) {
      const GA = await loadGA();
      GA.send({ hitType: 'pageview', page: path });
    }
  } catch (error) {
    logger.error(error, 'track_pageview');
  }
};

export const trackEvent = async (
  category: string,
  action: string,
  label?: string,
  value?: number,
  nonInteraction?: boolean,
  transport?: 'beacon' | 'xhr' | 'image'
) => {
  try {
    if (GA_MEASUREMENT_ID) {
      const GA = await loadGA();
      GA.event({
        category,
        action,
        label,
        value,
        nonInteraction,
        transport
      });
    }
  } catch (error) {
    logger.error(error, 'track_event');
  }
};

// Async user properties
export const setUserProperties = async (properties: { [key: string]: any }) => {
  try {
    if (GA_MEASUREMENT_ID) {
      const GA = await loadGA();
      GA.set(properties);
    }
  } catch (error) {
    logger.error(error, 'set_user_properties');
  }
};

// Async custom dimensions
export const setCustomDimension = async (dimensionIndex: number, value: string) => {
  try {
    if (GA_MEASUREMENT_ID) {
      const GA = await loadGA();
      GA.set({ [`dimension${dimensionIndex}`]: value });
    }
  } catch (error) {
    logger.error(error, 'set_custom_dimension');
  }
};

// Async exception tracking
export const trackException = async (description: string, fatal: boolean = false) => {
  try {
    if (GA_MEASUREMENT_ID) {
      const GA = await loadGA();
      GA.exception({
        description,
        fatal
      });
    }
  } catch (error) {
    logger.error(error, 'track_exception');
  }
};

// Async timing tracking
export const trackTiming = async (
  category: string,
  variable: string,
  value: number,
  label?: string
) => {
  try {
    if (GA_MEASUREMENT_ID) {
      const GA = await loadGA();
      GA.timing({
        category,
        variable,
        value,
        label
      });
    }
  } catch (error) {
    logger.error(error, 'track_timing');
  }
};

// Event categories
export const EventCategories = {
  Auth: 'Authentication',
  Incident: 'Incident',
  Map: 'Map',
  Navigation: 'Navigation',
  UserInteraction: 'User Interaction',
  Error: 'Error',
  Performance: 'Performance'
} as const;

// Event actions
export const EventActions = {
  // Auth events
  SignUp: 'Sign Up',
  SignIn: 'Sign In',
  SignOut: 'Sign Out',
  GoogleSignIn: 'Google Sign In',
  
  // Incident events
  Create: 'Create Incident',
  View: 'View Incident',
  Share: 'Share Incident',
  UpdatePresence: 'Update Presence',
  AddMedia: 'Add Media',
  
  // Map events
  Pan: 'Pan Map',
  Zoom: 'Zoom Map',
  ClickMarker: 'Click Marker',
  
  // Navigation events
  ChangeView: 'Change View',
  ChangeLanguage: 'Change Language',
  
  // Error events
  ApiError: 'API Error',
  AuthError: 'Auth Error',
  LocationError: 'Location Error',
  
  // Performance events
  LoadTime: 'Load Time',
  ApiLatency: 'API Latency'
} as const;