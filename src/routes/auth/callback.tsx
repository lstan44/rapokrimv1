import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session from URL
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (!session) {
          throw new Error('No session found');
        }

        // Set user in context
        setUser(session.user);

        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);

        // Navigate back to home
        navigate('/', { replace: true });
      } catch (error) {
        logger.error(error, 'auth_callback');
        navigate('/', { 
          replace: true,
          state: { authError: 'Failed to authenticate' }
        });
      }
    };

    handleCallback();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>
  );
}