import ZegoExpressEngine from 'zego-express-web-rtc';

class ZegoCloudService {
  constructor() {
    this.engine = null;
    this.appID = parseInt(process.env.REACT_APP_ZEGO_APP_ID || '0');
    this.serverSecret = process.env.REACT_APP_ZEGO_SERVER_SECRET;
    this.isInitialized = false;
    this.currentRoomID = null;
    this.currentUserID = null;
    this.currentToken = null;
    this.localStream = null;
    this.remoteStreams = new Map();
    this.eventHandlers = {};
  }

  /**
   * Initialize ZegoCloud engine
   */
  async initZego() {
    if (this.isInitialized) {
      console.log('[Zego] Already initialized');
      return true;
    }

    try {
      if (!this.appID) {
        throw new Error('REACT_APP_ZEGO_APP_ID not configured');
      }

      // Create engine instance
      this.engine = new ZegoExpressEngine(this.appID, {
        logLevel: 'warning',
        remoteLogLevel: 'warning'
      });

      // Setup event handlers
      this.setupEventHandlers();

      this.isInitialized = true;
      console.log('[Zego] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[Zego] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup all event handlers
   */
  setupEventHandlers() {
    if (!this.engine) return;

    // Room state changed
    this.engine.on('roomStateUpdate', (roomID, state, errorCode, extendedData) => {
      console.log(`[Zego] Room state changed: ${roomID}, state: ${state}, error: ${errorCode}`);
      this.emit('roomStateUpdate', { roomID, state, errorCode });
    });

    // User joined
    this.engine.on('roomUserUpdate', (roomID, updateType, userList) => {
      console.log(`[Zego] User update in room ${roomID}:`, updateType, userList);
      this.emit('userUpdate', { roomID, updateType, userList });
    });

    // Stream added
    this.engine.on('roomStreamUpdate', (roomID, updateType, streamList, extendedData) => {
      console.log(`[Zego] Stream update in room ${roomID}:`, updateType, streamList);
      
      if (updateType === 'ADD') {
        streamList.forEach(stream => {
          console.log(`[Zego] Stream added: ${stream.streamID}`);
          this.emit('streamAdded', { roomID, stream });
        });
      } else if (updateType === 'DELETE') {
        streamList.forEach(stream => {
          console.log(`[Zego] Stream removed: ${stream.streamID}`);
          this.remoteStreams.delete(stream.streamID);
          this.emit('streamRemoved', { roomID, stream });
        });
      }
    });

    // Publish state changed
    this.engine.on('publisherStateUpdate', (state, errorCode, extendedData) => {
      console.log(`[Zego] Publisher state: ${state}, error: ${errorCode}`);
      this.emit('publisherStateUpdate', { state, errorCode });
    });

    // Publish quality update
    this.engine.on('publishQualityUpdate', (stats) => {
      console.log('[Zego] Publish quality:', stats);
      this.emit('publishQualityUpdate', stats);
    });

    // Play quality update
    this.engine.on('playQualityUpdate', (streamID, stats) => {
      console.log(`[Zego] Play quality for ${streamID}:`, stats);
      this.emit('playQualityUpdate', { streamID, stats });
    });

    // Error
    this.engine.on('error', (errorCode) => {
      console.error(`[Zego] Error: ${errorCode}`);
      this.emit('error', { errorCode });
    });
  }

  /**
   * Login to a room
   */
  async loginRoom(roomID, userID, userName, token) {
    try {
      if (!this.engine) {
        throw new Error('Engine not initialized');
      }

      this.currentRoomID = roomID;
      this.currentUserID = userID;
      this.currentToken = token;

      const user = { userID, userName };
      
      console.log(`[Zego] Logging in to room ${roomID} as ${userName}`);
      
      await this.engine.loginRoom(roomID, token, user, {
        maxMemberCount: 0,
        isUserStatusNotify: true,
        userUpdate: true
      });

      console.log('[Zego] Room login successful');
      this.emit('roomLoginSuccess', { roomID, userID, userName });
      return true;
    } catch (error) {
      console.error('[Zego] Room login failed:', error);
      this.emit('roomLoginFailed', { error: error.message });
      throw error;
    }
  }

  /**
   * Logout from room
   */
  async logoutRoom() {
    try {
      if (!this.engine || !this.currentRoomID) return;

      console.log(`[Zego] Logging out from room ${this.currentRoomID}`);
      
      // Stop publishing
      if (this.localStream) {
        await this.stopPublishing();
      }

      // Stop playing all remote streams
      for (const [streamID] of this.remoteStreams) {
        await this.stopPlayingStream(streamID);
      }

      await this.engine.logoutRoom(this.currentRoomID);
      
      this.currentRoomID = null;
      this.currentUserID = null;
      this.currentToken = null;
      this.remoteStreams.clear();

      console.log('[Zego] Room logout successful');
      this.emit('roomLogoutSuccess');
      return true;
    } catch (error) {
      console.error('[Zego] Room logout failed:', error);
      throw error;
    }
  }

  /**
   * Start publishing local stream
   */
  async startPublishing(streamID, videoElement, config = {}) {
    try {
      if (!this.engine) {
        throw new Error('Engine not initialized');
      }

      console.log(`[Zego] Starting to publish stream ${streamID}`);

      const defaultConfig = {
        audio: true,
        video: true,
        videoSource: 'camera',
        audioSource: 'mic',
        videoCodec: 'H264',
        bitrate: 1500,
        frameRate: 30,
        resolution: '1280x720'
      };

      const publishConfig = { ...defaultConfig, ...config };

      // Create local stream
      this.localStream = await this.engine.createStream(publishConfig);

      // Set video element
      if (videoElement) {
        this.localStream.play(videoElement);
      }

      // Start publishing
      await this.engine.startPublishingStream(streamID, this.localStream);

      console.log(`[Zego] Publishing stream ${streamID} started`);
      this.emit('publishingStarted', { streamID });
      return this.localStream;
    } catch (error) {
      console.error('[Zego] Failed to start publishing:', error);
      this.emit('publishingFailed', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop publishing local stream
   */
  async stopPublishing() {
    try {
      if (!this.engine || !this.localStream) return;

      console.log('[Zego] Stopping publishing');

      await this.engine.stopPublishingStream();
      this.localStream.stop();
      this.localStream = null;

      console.log('[Zego] Publishing stopped');
      this.emit('publishingStopped');
      return true;
    } catch (error) {
      console.error('[Zego] Failed to stop publishing:', error);
      throw error;
    }
  }

  /**
   * Start playing remote stream
   */
  async startPlayingStream(streamID, videoElement) {
    try {
      if (!this.engine) {
        throw new Error('Engine not initialized');
      }

      console.log(`[Zego] Starting to play stream ${streamID}`);

      const remoteStream = await this.engine.startPlayingStream(streamID, {
        video: videoElement
      });

      this.remoteStreams.set(streamID, remoteStream);

      console.log(`[Zego] Playing stream ${streamID}`);
      this.emit('playingStarted', { streamID });
      return remoteStream;
    } catch (error) {
      console.error(`[Zego] Failed to play stream ${streamID}:`, error);
      this.emit('playingFailed', { streamID, error: error.message });
      throw error;
    }
  }

  /**
   * Stop playing remote stream
   */
  async stopPlayingStream(streamID) {
    try {
      if (!this.engine) return;

      console.log(`[Zego] Stopping to play stream ${streamID}`);

      await this.engine.stopPlayingStream(streamID);
      this.remoteStreams.delete(streamID);

      console.log(`[Zego] Stopped playing stream ${streamID}`);
      this.emit('playingStopped', { streamID });
      return true;
    } catch (error) {
      console.error(`[Zego] Failed to stop playing stream ${streamID}:`, error);
      throw error;
    }
  }

  /**
   * Toggle video on/off
   */
  async toggleVideo(enabled) {
    try {
      if (!this.localStream) return;

      if (enabled) {
        await this.localStream.getVideoTrack().enable();
      } else {
        await this.localStream.getVideoTrack().disable();
      }

      console.log(`[Zego] Video ${enabled ? 'enabled' : 'disabled'}`);
      this.emit('videoToggled', { enabled });
      return true;
    } catch (error) {
      console.error('[Zego] Failed to toggle video:', error);
      throw error;
    }
  }

  /**
   * Toggle audio on/off
   */
  async toggleAudio(enabled) {
    try {
      if (!this.localStream) return;

      if (enabled) {
        await this.localStream.getAudioTrack().enable();
      } else {
        await this.localStream.getAudioTrack().disable();
      }

      console.log(`[Zego] Audio ${enabled ? 'enabled' : 'disabled'}`);
      this.emit('audioToggled', { enabled });
      return true;
    } catch (error) {
      console.error('[Zego] Failed to toggle audio:', error);
      throw error;
    }
  }

  /**
   * Get all remote streams
   */
  getRemoteStreams() {
    return Array.from(this.remoteStreams.values());
  }

  /**
   * Get remote stream by ID
   */
  getRemoteStream(streamID) {
    return this.remoteStreams.get(streamID);
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
        console.error(`[Zego] Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Cleanup
   */
  async destroy() {
    try {
      await this.logoutRoom();
      if (this.engine) {
        this.engine.destroy();
        this.engine = null;
      }
      this.isInitialized = false;
      console.log('[Zego] Service destroyed');
    } catch (error) {
      console.error('[Zego] Error during cleanup:', error);
    }
  }
}

export default new ZegoCloudService();
