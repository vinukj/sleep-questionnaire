/**
 * AudioStreamer - Real-time audio streaming utility
 * Handles WebSocket connection, microphone access, and audio streaming
 */

export const StreamState = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  RECORDING: 'recording',
  ERROR: 'error'
};

export class AudioStreamer {
  constructor(config = {}) {
    this.wsUrl = config.wsUrl || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//localhost:5000/ws/audio`;
    this.onStateChange = config.onStateChange || (() => {});
    this.onTranscription = config.onTranscription || (() => {});
    this.onError = config.onError || (() => {});
    
    // Audio configuration
    this.audioConstraints = {
      audio: {
        channelCount: 1, // Mono
        sampleRate: 16000, // 16kHz
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };
    
    // State
    this.state = StreamState.IDLE;
    this.ws = null;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 3;
    this.reconnectDelay = config.reconnectDelay || 2000;
  }

  /**
   * Initialize and start the audio streaming
   */
  async start() {
    try {
      this.updateState(StreamState.CONNECTING);
      
      // Step 1: Connect to WebSocket
      await this.connectWebSocket();
      
      // Step 2: Request microphone access
      await this.initializeAudio();
      
      // Step 3: Start recording and streaming
      this.startRecording();
      
      this.updateState(StreamState.RECORDING);
      this.reconnectAttempts = 0; // Reset on successful start
    } catch (error) {
      this.handleError('Failed to start audio streaming', error);
      this.cleanup();
    }
  }

  /**
   * Connect to WebSocket server
   */
  connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);
        
        // Set binary type for audio data
        this.ws.binaryType = 'arraybuffer';
        
        this.ws.onopen = () => {
          console.log('WebSocket connected to', this.wsUrl);
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          
          // Attempt reconnection if not manually stopped
          if (this.state === StreamState.RECORDING) {
            this.attemptReconnection();
          }
        };
        
        // Timeout for connection
        const timeout = setTimeout(() => {
          if (this.ws.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
        
        this.ws.addEventListener('open', () => clearTimeout(timeout), { once: true });
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Initialize audio capture
   */
  async initializeAudio() {
    try {
      // Request microphone access with specific constraints
      this.mediaStream = await navigator.mediaDevices.getUserMedia(this.audioConstraints);
      
      // Verify audio track settings
      const audioTrack = this.mediaStream.getAudioTracks()[0];
      const settings = audioTrack.getSettings();
      console.log('Audio track settings:', {
        sampleRate: settings.sampleRate,
        channelCount: settings.channelCount
      });
      
      // Create MediaRecorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      // Handle audio data chunks
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
          // Send raw binary blob over WebSocket
          this.ws.send(event.data);
        }
      };
      
      this.mediaRecorder.onerror = (error) => {
        this.handleError('MediaRecorder error', error);
      };
      
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Microphone access denied. Please grant permission and try again.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.');
      }
      throw error;
    }
  }

  /**
   * Get supported MIME type for audio recording
   */
  getSupportedMimeType() {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];
    
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log('Using MIME type:', mimeType);
        return mimeType;
      }
    }
    
    // Fallback to default
    return '';
  }

  /**
   * Start recording with 100ms timeslice for low-latency streaming
   */
  startRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      // 100ms timeslice for low-latency streaming
      this.mediaRecorder.start(100);
      console.log('MediaRecorder started with 100ms timeslice');
    }
  }

  /**
   * Handle incoming messages from WebSocket
   */
  handleMessage(data) {
    try {
      // Parse JSON messages
      const message = JSON.parse(data);
      
      // Handle different message types
      switch (message.type) {
        case 'transcribed':
          // Handle transcription with speaker diarization
          this.onTranscription({
            text: message.text,
            speakerId: message.speaker_id,
            timestamp: message.timestamp || Date.now(),
            confidence: message.confidence
          });
          break;
          
        case 'interim':
          // Handle interim/partial transcriptions
          this.onTranscription({
            text: message.text,
            speakerId: message.speaker_id,
            timestamp: message.timestamp || Date.now(),
            interim: true
          });
          break;
          
        case 'error':
          this.handleError('Server error', new Error(message.message || 'Unknown server error'));
          break;
          
        case 'status':
          console.log('Server status:', message.status);
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      // If not JSON, log raw data
      console.log('Received non-JSON message:', data);
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  async attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handleError('Max reconnection attempts reached', new Error('Failed to reconnect'));
      this.stop();
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(async () => {
      try {
        await this.connectWebSocket();
        this.startRecording();
        console.log('Reconnected successfully');
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.attemptReconnection();
      }
    }, this.reconnectDelay);
  }

  /**
   * Stop streaming and cleanup resources
   */
  stop() {
    console.log('Stopping audio streamer...');
    this.cleanup();
    this.updateState(StreamState.IDLE);
  }

  /**
   * Cleanup all resources
   * CRITICAL: Ensures proper cleanup to prevent memory leaks
   */
  cleanup() {
    // Stop and cleanup MediaRecorder
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder.ondataavailable = null;
      this.mediaRecorder.onerror = null;
      this.mediaRecorder = null;
    }
    
    // Stop all media stream tracks (removes mic-in-use indicator)
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      this.mediaStream = null;
    }
    
    // Close WebSocket connection
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client stopped streaming');
      }
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws = null;
    }
    
    console.log('Cleanup completed');
  }

  /**
   * Update state and notify listeners
   */
  updateState(newState) {
    this.state = newState;
    this.onStateChange(newState);
  }

  /**
   * Handle errors
   */
  handleError(message, error) {
    console.error(message, error);
    this.updateState(StreamState.ERROR);
    this.onError({
      message,
      error: error.message || error.toString(),
      timestamp: Date.now()
    });
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Check if currently recording
   */
  isRecording() {
    return this.state === StreamState.RECORDING;
  }
}

/**
 * Factory function for creating AudioStreamer instances
 */
export function createAudioStreamer(config) {
  return new AudioStreamer(config);
}

export default AudioStreamer;
