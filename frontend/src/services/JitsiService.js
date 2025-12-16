/**
 * Jitsi Meet Service
 * Handles Jitsi Meet integration for video calls
 */

class JitsiService {
  constructor() {
    this.api = null;
    this.isInitialized = false;
    this.currentRoomName = null;
    this.eventHandlers = {};
  }

  /**
   * Initialize Jitsi Meet API
   */
  async initJitsi() {
    if (this.isInitialized) {
      console.log('[Jitsi] Already initialized');
      return true;
    }

    try {
      // Load Jitsi Meet external API script
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => {
          console.log('[Jitsi] API script loaded');
          this.isInitialized = true;
          resolve(true);
        };
        script.onerror = () => {
          console.error('[Jitsi] Failed to load API script');
          reject(new Error('Failed to load Jitsi API'));
        };
        document.body.appendChild(script);
      });
    } catch (error) {
      console.error('[Jitsi] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create and join a Jitsi room
   */
  createRoom(roomName, userName, containerElement, options = {}) {
    try {
      if (!window.JitsiMeetExternalAPI) {
        throw new Error('Jitsi API not loaded');
      }

      console.log(`[Jitsi] Creating room: ${roomName} for user: ${userName}`);

      this.currentRoomName = roomName;

      const defaultOptions = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: containerElement,
        configOverwrite: {
          startAudioOnly: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableAudioLevels: false,
          enableWelcomePage: false,
          enableClosePage: false,
          prejoinPageEnabled: false,
          disableProfile: false,
          disableInviteFunctions: false,
          toolbarButtons: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'profile',
            'chat',
            'recording',
            'livestreaming',
            'etherpad',
            'sharedvideo',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'invite',
            'feedback',
            'stats',
            'shortcuts',
            'tileview',
            'videobackgroundblur',
            'download',
            'help',
            'mute-everyone',
            'e2ee'
          ]
        },
        interfaceConfigOverwrite: {
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          DISABLE_PRESENCE_STATUS: false,
          SHOW_JITSI_WATERMARK: true,
          MOBILE_APP_PROMO: false,
          LANG_DETECTION: true,
          DEFAULT_LANGUAGE: 'en',
          SHOW_WATERMARK_FOR_GUESTS: true,
          TOOLBAR_TIMEOUT: 4000,
          TOOLBAR_ALWAYS_VISIBLE: false,
          INITIAL_TOOLBAR_TIMEOUT: 20000,
          FILMSTRIP_MAXHEIGHT: 120,
          VERTICAL_FILMSTRIP: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          DISABLE_FOCUS_INDICATOR: false,
          DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
          DISABLE_SCREEN_SHARE_AUDIO: false,
          DISABLE_AUDIO_LEVELS: false,
          ENABLE_DIAL_OUT: false,
          ENABLE_FILE_RECORDING_SERVICE: false,
          ENABLE_RECORDING: true,
          ENABLE_SIMULCAST: true,
          ENABLE_STATS_ID: true,
          ENABLE_TRANSCRIPTIONS: false,
          ENABLE_WELCOME_PAGE: false,
          HIDE_INVITE_MORE_HEADER: false,
          HIDE_DEEP_LINKING_LOGO: false,
          JITSI_WATERMARK_LINK: 'https://jitsi.org',
          PROVIDER_NAME: 'Jitsi',
          SUPPORT_URL: 'https://community.jitsi.org',
          GENERATE_ROOMNAMES_ON_WELCOME_PAGE: true,
          DISPLAY_WELCOME_FOOTER: true,
          APP_NAME: 'InteractHub',
          NATIVE_SRC_DISCOVERY_ENABLED: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_DEEP_LINKING_IMAGE: false,
          DEEP_LINKING_IMAGE_LOGO: '',
          INVITATION_POWERED_BY: false,
          DISABLE_RINGING: false,
          AUDIO_LEVEL_PRIMARY_COLOR: 'rgba(255, 255, 255, 0.4)',
          AUDIO_LEVEL_SECONDARY_COLOR: 'rgba(255, 255, 255, 0.2)',
          DOMINANT_SPEAKER_AVATAR_SIZE: 100,
          FILMSTRIP_BREAKPOINT: 120,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Fellow Jitster',
          DEFAULT_LOCAL_DISPLAY_NAME: 'me',
          SETTINGS_SECTIONS: [
            'devices',
            'language',
            'moderator',
            'profile',
            'calendar',
            'sounds',
            'more'
          ],
          RECENT_LIST_ENABLED: true,
          SETTINGS_NOTIFICATION_INTERVAL: 10000,
          OPEN_BROWSER_CONSOLE: false,
          CHECK_UPDATES: true,
          CHROME_EXTENSION_BANNER_CLOSE: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          CHROME_EXTENSION_BANNER_LINK: '',
          HIDE_KICK_BUTTON_FOR_GUESTS: false,
          MOBILE_DYNAMIC_LINK_PREFIX: '',
          ENFORCE_NOTIFICATION_AUTO_DISMISS_TIMEOUT: 15000,
          ENFORCE_BREAKOUT_ROOMS_PARTICIPANT_NOTIFICATIONS: true,
          ENFORCE_BREAKOUT_ROOMS_SCREEN_SHARE_CONSTRAINT: false,
          BREAKOUT_ROOMS_ENABLED: true,
          LOBBY_MODE_ENABLED: false,
          AUTO_PIN_LATEST_SCREEN_SHARE: false,
          DISABLE_PRESENCE_STATUS: false,
          DISABLE_FOCUS_INDICATOR: false,
          DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
          DISABLE_SCREEN_SHARE_AUDIO: false,
          DISABLE_AUDIO_LEVELS: false
        },
        userInfo: {
          displayName: userName
        }
      };

      const mergedOptions = { ...defaultOptions, ...options };

      // Create Jitsi API instance
      this.api = new window.JitsiMeetExternalAPI('meet.jit.si', mergedOptions);

      // Setup event listeners
      this.setupEventListeners();

      console.log('[Jitsi] Room created successfully');
      this.emit('roomCreated', { roomName, userName });

      return this.api;
    } catch (error) {
      console.error('[Jitsi] Failed to create room:', error);
      this.emit('error', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.api) return;

    // User joined
    this.api.addEventListener('participantJoined', (participant) => {
      console.log('[Jitsi] Participant joined:', participant);
      this.emit('participantJoined', participant);
    });

    // User left
    this.api.addEventListener('participantLeft', (participant) => {
      console.log('[Jitsi] Participant left:', participant);
      this.emit('participantLeft', participant);
    });

    // Display name changed
    this.api.addEventListener('displayNameChange', (data) => {
      console.log('[Jitsi] Display name changed:', data);
      this.emit('displayNameChanged', data);
    });

    // Email changed
    this.api.addEventListener('emailChange', (data) => {
      console.log('[Jitsi] Email changed:', data);
      this.emit('emailChanged', data);
    });

    // Avatar changed
    this.api.addEventListener('avatarChanged', (data) => {
      console.log('[Jitsi] Avatar changed:', data);
      this.emit('avatarChanged', data);
    });

    // Video conference joined
    this.api.addEventListener('videoConferenceJoined', (data) => {
      console.log('[Jitsi] Video conference joined:', data);
      this.emit('conferenceJoined', data);
    });

    // Video conference left
    this.api.addEventListener('videoConferenceLeft', (data) => {
      console.log('[Jitsi] Video conference left:', data);
      this.emit('conferenceLeft', data);
    });

    // Ready to close
    this.api.addEventListener('readyToClose', () => {
      console.log('[Jitsi] Ready to close');
      this.emit('readyToClose');
    });

    // Audio availability changed
    this.api.addEventListener('audioAvailabilityChanged', (data) => {
      console.log('[Jitsi] Audio availability changed:', data);
      this.emit('audioAvailabilityChanged', data);
    });

    // Video availability changed
    this.api.addEventListener('videoAvailabilityChanged', (data) => {
      console.log('[Jitsi] Video availability changed:', data);
      this.emit('videoAvailabilityChanged', data);
    });

    // Audio muted status changed
    this.api.addEventListener('audioMuted', () => {
      console.log('[Jitsi] Audio muted');
      this.emit('audioMuted');
    });

    // Video muted status changed
    this.api.addEventListener('videoMuted', () => {
      console.log('[Jitsi] Video muted');
      this.emit('videoMuted');
    });

    // Screen sharing started
    this.api.addEventListener('screenSharingStarted', () => {
      console.log('[Jitsi] Screen sharing started');
      this.emit('screenSharingStarted');
    });

    // Screen sharing stopped
    this.api.addEventListener('screenSharingStopped', () => {
      console.log('[Jitsi] Screen sharing stopped');
      this.emit('screenSharingStopped');
    });

    // Recording status changed
    this.api.addEventListener('recordingStatusChanged', (data) => {
      console.log('[Jitsi] Recording status changed:', data);
      this.emit('recordingStatusChanged', data);
    });

    // Error occurred
    this.api.addEventListener('error', (error) => {
      console.error('[Jitsi] Error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Execute command
   */
  executeCommand(command, ...args) {
    try {
      if (!this.api) {
        throw new Error('Jitsi API not initialized');
      }
      this.api.executeCommand(command, ...args);
      console.log(`[Jitsi] Command executed: ${command}`);
    } catch (error) {
      console.error(`[Jitsi] Failed to execute command ${command}:`, error);
    }
  }

  /**
   * Toggle audio
   */
  toggleAudio() {
    this.executeCommand('toggleAudio');
  }

  /**
   * Toggle video
   */
  toggleVideo() {
    this.executeCommand('toggleVideo');
  }

  /**
   * Toggle screen share
   */
  toggleScreenShare() {
    this.executeCommand('toggleScreenShare');
  }

  /**
   * Hang up
   */
  hangUp() {
    try {
      if (this.api) {
        this.api.dispose();
        this.api = null;
        this.currentRoomName = null;
        console.log('[Jitsi] Hung up');
        this.emit('hungUp');
      }
    } catch (error) {
      console.error('[Jitsi] Error hanging up:', error);
    }
  }

  /**
   * Get participants
   */
  getParticipants() {
    try {
      if (!this.api) return [];
      return this.api.getParticipants();
    } catch (error) {
      console.error('[Jitsi] Error getting participants:', error);
      return [];
    }
  }

  /**
   * Event emitter
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  off(event, handler) {
    if (!this.eventHandlers[event]) return;
    this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
  }

  emit(event, data) {
    if (!this.eventHandlers[event]) return;
    this.eventHandlers[event].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[Jitsi] Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    try {
      this.hangUp();
      this.isInitialized = false;
      this.eventHandlers = {};
      console.log('[Jitsi] Service destroyed');
    } catch (error) {
      console.error('[Jitsi] Error during cleanup:', error);
    }
  }
}

export default new JitsiService();
