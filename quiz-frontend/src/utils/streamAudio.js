/**
 * AudioStreamer - Real-time audio streaming utility
 * Handles WebSocket connection, microphone access, and raw PCM audio streaming
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
    this.onGeminiResult = config.onGeminiResult || (() => {});
    this.onError = config.onError || (() => {});

    // Audio configuration - raw PCM 16kHz mono
    this.audioConstraints = {
      audio: {
        channelCount: { ideal: 1 },
        sampleRate: { ideal: 16000 },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };

    // State
    this.state = StreamState.IDLE;
    this.ws = null;
    this.mediaStream = null;
    this.audioContext = null;
    this.scriptProcessor = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 3;
    this.reconnectDelay = config.reconnectDelay || 2000;
    this.buffer = new Int16Array(0); // Accumulator for resampling
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

      this.updateState(StreamState.RECORDING);
      this.reconnectAttempts = 0;
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

          if (this.state === StreamState.RECORDING) {
            this.attemptReconnection();
          }
        };

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
   * Initialize audio capture using AudioContext + ScriptProcessor
   * Sends raw PCM 16-bit 16kHz mono over WebSocket
   */
  async initializeAudio() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia(this.audioConstraints);

      const audioTrack = this.mediaStream.getAudioTracks()[0];
      const settings = audioTrack.getSettings();
      console.log('Audio track settings:', {
        sampleRate: settings.sampleRate,
        channelCount: settings.channelCount
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // ScriptProcessorNode with 128ms buffer at 16kHz = 2048 samples (nearest valid power of 2)
      const bufferSize = 2048;
      this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      this.scriptProcessor.onaudioprocess = (event) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputBuffer = event.inputBuffer;
        const floatSamples = inputBuffer.getChannelData(0);

        // Convert Float32 [-1, 1] to Int16
        const int16Samples = new Int16Array(floatSamples.length);
        for (let i = 0; i < floatSamples.length; i++) {
          const s = Math.max(-1, Math.min(1, floatSamples[i]));
          int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        this.ws.send(int16Samples.buffer);
      };

      source.connect(this.scriptProcessor);
      // ScriptProcessor must be connected to a destination to fire events
      this.scriptProcessor.connect(this.audioContext.destination);

      console.log('Raw PCM streaming started (16kHz, 16-bit, mono)');

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
   * Handle incoming messages from WebSocket
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'transcribed':
          this.onTranscription({
            text: message.text,
            speakerId: message.speaker_id,
            timestamp: message.timestamp || Date.now(),
            confidence: message.confidence
          });
          break;

        case 'recognizing':
        case 'interim':
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

        case 'gemini_result':
          this.onGeminiResult(message.result);
          break;

        default:
          // log messages (transcribing, recognized, session, etc.)
          break;
      }
    } catch (error) {
      // Not JSON
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
        console.log('Reconnected successfully');
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.attemptReconnection();
      }
    }, this.reconnectDelay);
  }

  /**
   * Stop streaming and cleanup
   */
  stop() {
    console.log('Stopping audio streamer...');
    this.cleanup();
    this.updateState(StreamState.IDLE);
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    if (this.scriptProcessor) {
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
      });
      this.mediaStream = null;
    }

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

    this.buffer = new Int16Array(0);

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

  getState() {
    return this.state;
  }

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
