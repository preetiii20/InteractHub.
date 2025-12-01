/**
 * Notification Service
 * Handles all notification types: messages, announcements, polls, calls
 */

class NotificationService {
  constructor() {
    this.audioContext = null;
    this.notificationPermission = 'default';
    this.initAudio();
    this.requestPermission();
  }

  // Initialize Web Audio API for sound notifications
  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  // Request browser notification permission
  requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        this.notificationPermission = permission;
      });
    } else if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }
  }

  // Play notification sound (pop sound)
  playNotificationSound(type = 'message') {
    if (!this.audioContext) return;

    try {
      const now = this.audioContext.currentTime;
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Different sounds for different notification types
      const sounds = {
        message: { frequency: 800, duration: 0.1 },
        announcement: { frequency: 600, duration: 0.15 },
        poll: { frequency: 700, duration: 0.12 },
        call: { frequency: 900, duration: 0.2 },
      };

      const sound = sounds[type] || sounds.message;

      oscillator.frequency.value = sound.frequency;
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + sound.duration);

      oscillator.start(now);
      oscillator.stop(now + sound.duration);
    } catch (e) {
      console.warn('Could not play notification sound:', e);
    }
  }

  // Show browser native notification
  showBrowserNotification(title, options = {}) {
    if (this.notificationPermission !== 'granted' || !('Notification' in window)) {
      return;
    }

    const defaultOptions = {
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: options.tag || 'notification',
      requireInteraction: options.requireInteraction || false,
      ...options,
    };

    const notification = new Notification(title, defaultOptions);

    if (options.onClick) {
      notification.onclick = options.onClick;
    }

    return notification;
  }

  // Show message notification
  showMessageNotification(from, content, onClickCallback) {
    this.playNotificationSound('message');
    
    this.showBrowserNotification(`New message from ${from}`, {
      body: content.substring(0, 100),
      tag: `message-${from}`,
      onClick: onClickCallback,
    });
  }

  // Show announcement notification
  showAnnouncementNotification(title, content, onClickCallback) {
    this.playNotificationSound('announcement');
    
    this.showBrowserNotification(`📢 ${title}`, {
      body: content.substring(0, 100),
      tag: 'announcement',
      requireInteraction: true,
      onClick: onClickCallback,
    });
  }

  // Show poll notification
  showPollNotification(question, onClickCallback) {
    this.playNotificationSound('poll');
    
    this.showBrowserNotification('📊 New Poll', {
      body: question.substring(0, 100),
      tag: 'poll',
      requireInteraction: true,
      onClick: onClickCallback,
    });
  }

  // Show incoming call notification
  showCallNotification(from, callType = 'VIDEO', onClickCallback) {
    this.playNotificationSound('call');
    
    this.showBrowserNotification(`📞 Incoming ${callType} Call`, {
      body: `From: ${from}`,
      tag: `call-${from}`,
      requireInteraction: true,
      onClick: onClickCallback,
    });
  }

  // Show group notification
  showGroupNotification(groupName, message, onClickCallback) {
    this.playNotificationSound('message');
    
    this.showBrowserNotification(`👥 ${groupName}`, {
      body: message.substring(0, 100),
      tag: `group-${groupName}`,
      onClick: onClickCallback,
    });
  }

  // Update browser tab title with unread count
  updateTabTitle(unreadCount) {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) InteractHub`;
    } else {
      document.title = 'InteractHub';
    }
  }

  // Close all notifications
  closeAllNotifications() {
    if ('Notification' in window) {
      Notification.close?.();
    }
  }
}

export default new NotificationService();
