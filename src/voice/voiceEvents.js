/**
 * Standardized Voice Events and State definitions for Frontend Integration
 */

export const VOICE_STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  TRANSCRIBING: 'TRANSCRIBING',
  SPEAKING: 'SPEAKING',
  INTERRUPTED: 'INTERRUPTED',
  ERROR: 'ERROR',
};

export const VOICE_EVENTS = {
  VOICE_STARTED: 'voice.started',
  VOICE_STOPPED: 'voice.stopped',
  TRANSCRIPTION_COMPLETED: 'transcription.completed',
  SPEECH_STARTED: 'speech.started',
  SPEECH_STOPPED: 'speech.stopped',
  SPEECH_INTERRUPTED: 'speech.interrupted',
  VOICE_ERROR: 'voice.error',
  STATE_CHANGED: 'voice.state_changed',
};
