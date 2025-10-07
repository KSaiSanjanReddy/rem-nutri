import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiBellOff, FiX } from 'react-icons/fi';
import notificationService from '../../services/notificationService';

const NotificationPermission = ({ onClose }) => {
  const [permissionStatus, setPermissionStatus] = useState(notificationService.permission);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setPermissionStatus(notificationService.permission);
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await notificationService.requestPermission();
      setPermissionStatus(notificationService.permission);
      
      if (granted) {
        // Show a test notification
        notificationService.showNotification('🔔 Notifications Enabled!', {
          body: 'You\'ll now receive notifications for new messages',
          tag: 'permission-granted'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleEnable = () => {
    handleRequestPermission();
  };

  const handleTestNotification = () => {
    if (notificationService.canNotify()) {
      notificationService.showNotification('🔔 Test Notification', {
        body: 'This is a test notification to verify everything is working!',
        tag: 'test-notification'
      });
    }
  };

  const handleDismiss = () => {
    if (onClose) {
      onClose();
    }
  };

  // Don't show if permission is already granted or denied
  if (permissionStatus === 'granted' || permissionStatus === 'denied') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <FiBell className="w-5 h-5 text-blue-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-blue-900">
            Enable Notifications
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            Get notified when you receive new messages, even when the app is in the background.
          </p>
          
          <div className="flex items-center space-x-3 mt-3">
            <button
              onClick={handleEnable}
              disabled={isRequesting}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRequesting ? 'Requesting...' : 'Enable'}
            </button>
            
            {permissionStatus === 'granted' && (
              <button
                onClick={handleTestNotification}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                Test Notification
              </button>
            )}
            
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-blue-600 text-sm hover:text-blue-800 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-blue-400 hover:text-blue-600 transition-colors"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default NotificationPermission;
