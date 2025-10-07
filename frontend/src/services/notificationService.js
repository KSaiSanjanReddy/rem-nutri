class NotificationService {
  constructor() {
    this.permission = null;
    this.isSupported = 'Notification' in window;
    this.initialize();
  }

  initialize() {
    if (!this.isSupported) {
      console.log('🔔 Notifications not supported in this browser');
      return;
    }

    // Check current permission status
    this.permission = Notification.permission;
    console.log('🔔 Initial notification permission:', this.permission);
  }

  async requestPermission() {
    if (!this.isSupported) {
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      console.log('🔔 Permission result:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('🔔 Error requesting notification permission:', error);
      return false;
    }
  }

  canNotify() {
    return this.isSupported && this.permission === 'granted';
  }

  showNotification(title, options = {}) {
    console.log('🔔 showNotification called with:', title, options);
    console.log('🔔 canNotify():', this.canNotify());
    console.log('🔔 isSupported:', this.isSupported);
    console.log('🔔 permission:', this.permission);
    
    if (!this.canNotify()) {
      console.log('🔔 Cannot show notification - permission not granted');
      return null;
    }

    try {
      const notificationOptions = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
        silent: false,
        ...options
      };
      
      console.log('🔔 Creating notification with options:', notificationOptions);
      const notification = new Notification(title, notificationOptions);

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click to focus window
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      console.log('🔔 Notification created successfully:', title);
      return notification;
    } catch (error) {
      console.error('🔔 Error showing notification:', error);
      return null;
    }
  }

  showMessageNotification(senderName, messageContent, chatId) {
    const title = `New message from ${senderName}`;
    const body = messageContent.length > 50 
      ? `${messageContent.substring(0, 50)}...` 
      : messageContent;

    return this.showNotification(title, {
      body,
      tag: `chat-${chatId}`, // Prevent duplicate notifications
      data: { chatId, senderName }
    });
  }

  showVoiceNotification(senderName, chatId) {
    const title = `Voice message from ${senderName}`;
    
    return this.showNotification(title, {
      body: '🎤 Tap to listen',
      tag: `chat-${chatId}`,
      data: { chatId, senderName, type: 'voice' }
    });
  }

  showFileNotification(senderName, fileName, chatId) {
    const title = `File shared by ${senderName}`;
    
    return this.showNotification(title, {
      body: `📎 ${fileName}`,
      tag: `chat-${chatId}`,
      data: { chatId, senderName, type: 'file', fileName }
    });
  }

  // Clean up method
  destroy() {
    // Close any open notifications
    if (this.isSupported) {
      // Note: Cannot programmatically close notifications in modern browsers
      console.log('🔔 Notification service destroyed');
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
