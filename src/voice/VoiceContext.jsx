import React, { createContext, useContext } from 'react';
import { useVoiceAgent } from './useVoiceAgent';

const VoiceContext = createContext(null);

/**
 * VoiceProvider wrapper for Person 3 to wrap the React App tree.
 */
export function VoiceProvider({ children, onEvent }) {
  const voice = useVoiceAgent({ onEvent });

  return (
    <VoiceContext.Provider value={voice}>
      {children}
    </VoiceContext.Provider>
  );
}

/**
 * Access voice agent state and controls anywhere in the React component tree.
 */
export function useVoiceContext() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoiceContext must be used within a <VoiceProvider>');
  }
  return context;
}
