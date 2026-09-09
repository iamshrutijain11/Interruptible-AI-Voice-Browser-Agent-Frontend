import { useState, useEffect, useRef, useCallback } from 'react';
import { VOICE_STATES, VOICE_EVENTS } from './voiceEvents';

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || 'http://localhost:8000';
const WS_URL = import.meta.env?.VITE_WS_URL || 'ws://localhost:8000/ws/voice';

/**
 * Utility to convert Base64 string to Blob for audio playback
 */
function b64toBlob(b64Data, contentType = 'audio/wav') {
  try {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: contentType });
  } catch (e) {
    console.error('[b64toBlob] Conversion failed:', e);
    return null;
  }
}

/**
 * Custom React Hook for Voice Browser Agent Voice Layer
 */
export function useVoiceAgent(options = {}) {
  const { onEvent, autoConnectWs = true } = options;

  const [voiceState, setVoiceState] = useState(VOICE_STATES.IDLE);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentAudioRef = useRef(null);
  const wsRef = useRef(null);
  const activeTaskRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const accumulatedTranscriptRef = useRef('');

  // Synchronize state refs for stable event dispatching without causing re-render loops
  activeTaskRef.current = activeTaskId;
  const voiceStateRef = useRef(voiceState);
  voiceStateRef.current = voiceState;

  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  // Stable emitEvent helper - doesn't change on state updates or onEvent identity changes
  const emitEvent = useCallback((eventName, payload = {}) => {
    if (onEventRef.current && typeof onEventRef.current === 'function') {
      onEventRef.current({
        event: eventName,
        state: voiceStateRef.current,
        taskId: activeTaskRef.current,
        timestamp: new Date().toISOString(),
        ...payload,
      });
    }
  }, []);

  // --- 1. Audio Playback Interruption Helper ---
  const stopAudioPlaybackImmediately = useCallback(() => {
    if (currentAudioRef.current) {
      console.log('[VoicePlayback] Stopping current audio playback immediately');
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {
        // ignore
      }
      currentAudioRef.current = null;
    }
  }, []);

  // Helper to play raw audio blob with task cancellation check
  const playAudioBlob = useCallback((audioBlob, taskId) => {
    if (!audioBlob) return;
    stopAudioPlaybackImmediately();

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;

    if (taskId) setActiveTaskId(taskId);
    setVoiceState(VOICE_STATES.SPEAKING);
    emitEvent(VOICE_EVENTS.SPEECH_STARTED, { taskId });

    audio.onended = () => {
      console.log(`[VoiceAudio] Finished playback for task: ${taskId}`);
      currentAudioRef.current = null;
      URL.revokeObjectURL(audioUrl);
      if (activeTaskRef.current === taskId || !activeTaskRef.current) {
        setVoiceState(VOICE_STATES.IDLE);
        emitEvent(VOICE_EVENTS.SPEECH_STOPPED, { taskId });
      }
    };

    audio.onerror = (e) => {
      console.error('[VoiceAudio] Audio playback error:', e);
      currentAudioRef.current = null;
      URL.revokeObjectURL(audioUrl);
      setVoiceState(VOICE_STATES.IDLE);
    };

    audio.play().catch((err) => {
      console.warn('[VoiceAudio] Play was interrupted or blocked by autoplay policy:', err);
      setVoiceState(VOICE_STATES.IDLE);
    });
  }, [stopAudioPlaybackImmediately, emitEvent]);

  // --- 2. WebSocket Connection (Stable, only connects once) ---
  useEffect(() => {
    if (!autoConnectWs) return;

    let ws = null;
    let reconnectTimeout = null;
    let isDisposed = false;

    const connect = () => {
      if (isDisposed) return;
      try {
        ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[VoiceWS] Connected to Voice WebSocket');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle incoming audio stream from orchestrator or voice layer
            if (data.event === 'audio.payload' && data.audio_b64) {
              const format = data.format || 'wav';
              const blob = b64toBlob(data.audio_b64, `audio/${format}`);
              if (blob) {
                playAudioBlob(blob, data.task_id);
              }
            }

            if (data.state && voiceStateRef.current !== VOICE_STATES.LISTENING) {
              setVoiceState(data.state);
            }
            if (data.task_id) {
              setActiveTaskId(data.task_id);
            }
            if (data.event) {
              emitEvent(data.event, data);
            }
          } catch (e) {
            console.error('[VoiceWS] JSON parse error:', e);
          }
        };

        ws.onerror = (err) => {
          console.warn('[VoiceWS] WebSocket error:', err);
        };

        ws.onclose = () => {
          console.log('[VoiceWS] Connection closed');
          if (!isDisposed) {
            // Reconnect after 2 seconds if unexpectedly closed
            reconnectTimeout = setTimeout(connect, 2000);
          }
        };
      } catch (e) {
        console.warn('[VoiceWS] Failed to connect WebSocket:', e);
        if (!isDisposed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      wsRef.current = null;
    };
  }, [autoConnectWs, playAudioBlob, emitEvent]);

  // --- 3. Interruption Mechanism ---
  const interrupt = useCallback(async (newTaskId = null, reason = 'User interrupted') => {
    console.log(`[VoiceInterruption] Interrupting current speech for task: ${activeTaskRef.current}`);
    
    // Stop HTML5 Audio playback immediately on frontend
    stopAudioPlaybackImmediately();

    const previousTaskId = activeTaskRef.current;
    setActiveTaskId(newTaskId);
    setVoiceState(VOICE_STATES.INTERRUPTED);

    emitEvent(VOICE_EVENTS.SPEECH_INTERRUPTED, {
      interruptedTaskId: previousTaskId,
      newTaskId,
      reason,
    });

    // Notify backend over WebSocket or REST
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'interrupt',
        task_id: previousTaskId,
        new_task_id: newTaskId,
        reason,
      }));
    } else {
      try {
        await fetch(`${BACKEND_URL}/api/voice/interrupt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: previousTaskId, reason }),
        });
      } catch (e) {
        console.warn('[VoiceInterruption] HTTP notification failed:', e);
      }
    }
  }, [stopAudioPlaybackImmediately, emitEvent]);

  // --- 4. Microphone Input (Start / Stop Recording) ---
  const startListening = useCallback(async () => {
    try {
      setError(null);
      accumulatedTranscriptRef.current = '';

      // Auto-interrupt active speech if agent is currently speaking
      if (voiceStateRef.current === VOICE_STATES.SPEAKING || currentAudioRef.current) {
        await interrupt(null, 'User started speaking during TTS');
      }

      // Initialize Web Speech API if supported for live instant transcription
      const SpeechRecognitionClass = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-IN'; // Robust for English, accents & mixed speech

          recognition.onresult = (event) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; ++i) {
              fullText += event.results[i][0].transcript;
            }
            const cleanText = fullText.trim();
            if (cleanText) {
              accumulatedTranscriptRef.current = cleanText;
              setTranscription(cleanText);
            }
          };

          recognition.onerror = (e) => {
            console.warn('[WebSpeechAPI] recognition warning:', e.error);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn('[WebSpeechAPI] initialization failed:', e);
        }
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser environment. Ensure you are using localhost or HTTPS.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      // Determine supported MIME type
      let mimeType = '';
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      for (const t of candidates) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }

      const recorderOptions = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // 100ms slices
      setVoiceState(VOICE_STATES.LISTENING);
      emitEvent(VOICE_EVENTS.VOICE_STARTED);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'start_listening' }));
      }
      return true;
    } catch (err) {
      console.error('[VoiceMic] Permission or media error:', err);
      let errMsg = err.message || 'Unknown microphone error';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Microphone permission was denied. Please allow microphone access in your browser address bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No microphone device found on your computer.';
      }
      
      setError(errMsg);
      setVoiceState(VOICE_STATES.ERROR);
      emitEvent(VOICE_EVENTS.VOICE_ERROR, { error: errMsg });
      return false;
    }
  }, [interrupt, emitEvent]);

  const stopListening = useCallback(async (taskId = null) => {
    // 1. Stop Web Speech Recognition if active
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      speechRecognitionRef.current = null;
    }

    // Allow a small settling delay for the final speech token
    await new Promise((r) => setTimeout(r, 200));
    const webSpeechText = accumulatedTranscriptRef.current.trim();

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      const stream = mediaStreamRef.current;

      const cleanupTracks = () => {
        if (stream) {
          try {
            stream.getTracks().forEach((track) => track.stop());
          } catch (e) {
            // ignore
          }
          mediaStreamRef.current = null;
        }
      };

      // If Web Speech API already transcribed what the user spoke, use it directly!
      if (webSpeechText) {
        cleanupTracks();
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          try {
            mediaRecorder.stop();
          } catch (e) {
            // ignore
          }
        }
        setTranscription(webSpeechText);
        setVoiceState(VOICE_STATES.IDLE);
        emitEvent(VOICE_EVENTS.VOICE_STOPPED);
        emitEvent(VOICE_EVENTS.TRANSCRIPTION_COMPLETED, { text: webSpeechText, taskId });
        resolve(webSpeechText);
        return;
      }

      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        cleanupTracks();
        setVoiceState(VOICE_STATES.IDLE);
        resolve('');
        return;
      }

      mediaRecorder.onstop = async () => {
        cleanupTracks();
        try {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          audioChunksRef.current = [];

          if (audioBlob.size === 0) {
            console.warn('[VoiceMic] Captured audio blob is empty');
            setVoiceState(VOICE_STATES.IDLE);
            resolve('');
            return;
          }

          setVoiceState(VOICE_STATES.TRANSCRIBING);
          emitEvent(VOICE_EVENTS.VOICE_STOPPED);

          // Transcribe via backend API
          const formData = new FormData();
          formData.append('file', audioBlob, 'mic_input.webm');
          if (taskId) formData.append('task_id', taskId);

          const response = await fetch(`${BACKEND_URL}/api/voice/transcribe`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Transcription request failed with status ${response.status}`);
          }

          const result = await response.json();
          const cleanText = result.text || '';
          setTranscription(cleanText);
          setVoiceState(VOICE_STATES.IDLE);

          emitEvent(VOICE_EVENTS.TRANSCRIPTION_COMPLETED, { text: cleanText, taskId });
          resolve(cleanText);
        } catch (err) {
          console.error('[VoiceSTT] Transcription error:', err);
          setError(err.message);
          setVoiceState(VOICE_STATES.ERROR);
          emitEvent(VOICE_EVENTS.VOICE_ERROR, { error: err.message });
          resolve('');
        }
      };

      mediaRecorder.stop();
    });
  }, [emitEvent]);

  // --- 5. Direct Speech Playback (Rime TTS) ---
  const speak = useCallback(async (text, taskId) => {
    if (!text || !taskId) {
      console.warn('[VoiceTTS] Speak called without valid text or taskId');
      return;
    }

    try {
      setError(null);
      stopAudioPlaybackImmediately();

      setActiveTaskId(taskId);
      setVoiceState(VOICE_STATES.SPEAKING);
      emitEvent(VOICE_EVENTS.SPEECH_STARTED, { taskId, text });

      console.log(`[VoiceTTS] Requesting speech for task '${taskId}': "${text}"`);
      const response = await fetch(`${BACKEND_URL}/api/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, task_id: taskId }),
      });

      if (response.status === 409) {
        console.warn(`[VoiceTTS] Task '${taskId}' was invalidated before speech played`);
        setVoiceState(VOICE_STATES.INTERRUPTED);
        return;
      }

      if (!response.ok) {
        throw new Error(`Rime TTS failed with HTTP ${response.status}`);
      }

      const audioBlob = await response.blob();
      if (activeTaskRef.current !== taskId) {
        console.warn(`[VoiceTTS] Task '${taskId}' was superseded. Discarding audio.`);
        return;
      }

      playAudioBlob(audioBlob, taskId);
    } catch (err) {
      console.error('[VoiceTTS] Error playing Rime TTS:', err);
      setError(err.message);
      setVoiceState(VOICE_STATES.ERROR);
      emitEvent(VOICE_EVENTS.VOICE_ERROR, { error: err.message });
    }
  }, [stopAudioPlaybackImmediately, playAudioBlob, emitEvent]);

  // --- 6. Send Command to Orchestrator ---
  const sendCommand = useCallback(async (text) => {
    if (!text || !text.trim()) return null;
    setError(null);
    emitEvent('command.submitted', { text });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log(`[VoiceAgent] Sending command via WebSocket: "${text}"`);
      wsRef.current.send(JSON.stringify({
        action: 'command',
        text: text.trim(),
      }));
      return { status: 'sent_ws' };
    } else {
      console.log(`[VoiceAgent] Sending command via POST /api/command: "${text}"`);
      try {
        const res = await fetch(`${BACKEND_URL}/api/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.trim() }),
        });
        const result = await res.json();
        return result;
      } catch (err) {
        console.error('[VoiceAgent] Command request failed:', err);
        setError(`Failed to send command: ${err.message}`);
        return null;
      }
    }
  }, [emitEvent]);

  const stopSpeaking = useCallback(() => {
    stopAudioPlaybackImmediately();
    if (activeTaskRef.current) {
      interrupt(activeTaskRef.current, 'Explicit stop requested');
    } else {
      setVoiceState(VOICE_STATES.IDLE);
    }
  }, [stopAudioPlaybackImmediately, interrupt]);

  const resetState = useCallback(() => {
    stopAudioPlaybackImmediately();
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
      speechRecognitionRef.current = null;
    }
    setVoiceState(VOICE_STATES.IDLE);
    setActiveTaskId(null);
    setTranscription('');
    setError(null);
  }, [stopAudioPlaybackImmediately]);

  return {
    voiceState,
    activeTaskId,
    transcription,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    interrupt,
    sendCommand,
    resetState,
    VOICE_STATES,
    VOICE_EVENTS,
  };
}

