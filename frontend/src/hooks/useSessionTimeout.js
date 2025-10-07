import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateActivity, forceLogout } from '../store/slices/authSlice';

const SESSION_TIMEOUT = false; // Disabled - no automatic logout for chat app
const WARNING_TIME = false; // Disabled

export const useSessionTimeout = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, lastActivity } = useSelector((state) => state.auth);
  const timeoutRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Session timeout disabled for chat app
    // Users can stay logged in as long as they want
    // Only logout when they explicitly logout or open new tab/window
    
    console.log('🔒 Session timeout disabled - user stays logged in');
  }, [dispatch, isAuthenticated]);

  // No need to track activity since timeout is disabled
  return { showWarning: false }; // Always false since timeout is disabled
};

export default useSessionTimeout;
