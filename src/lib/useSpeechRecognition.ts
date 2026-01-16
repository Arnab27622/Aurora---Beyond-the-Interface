/**
 * Speech Recognition Hook
 * 
 * Browser-based voice input using Web Speech API:
 * - Continuous listening with interim/final results
 * - Microphone permission handling
 * - Error recovery and auto-restart
 * 
 * Features:
 * - Browser support detection
 * - Microphone access request handling
 * - Graceful error handling
 * - Language setting (en-US by default)
 * - Audio input buffering with final transcripts
 */

import { useEffect, useRef, useState, useCallback } from "react";

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  speechSupported: boolean;
  toggleSpeechRecognition: () => void;
}

/**
 * Speech Recognition Hook
 * 
 * Browser-based voice input using Web Speech API:
 * - Continuous listening with interim/final results
 * - Microphone permission handling
 * - Error recovery and auto-restart
 * 
 * @param setInput State setter for text input
 * @param setIsTyping State setter for typing indicator
 * @returns Object containing recognition state and controls
 */
export function useSpeechRecognition(
  setInput: (text: string) => void,
  setIsTyping: (typing: boolean) => void
): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const isListeningRef = useRef(false);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current || isListeningRef.current) return;

    try {
      // Request microphone permissions
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.start();
      setIsListening(true);
      isListeningRef.current = true;
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        console.error('Microphone access denied. Please allow microphone access in browser settings.');
      } else {
        console.error('Error accessing microphone:', error);
      }
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += text + ' ';
          } else {
            interimTranscript += text;
          }
        }

        const fullTranscript = finalTranscriptRef.current + interimTranscript;
        setInput(fullTranscript);
        setIsTyping(true);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          console.error('Microphone access denied. Please grant microphone permissions.');
        }
        stopListening();
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (isListeningRef.current) {
          startListening();
        }
      };
    }

    return () => {
      stopListening();
    };
  }, [startListening, stopListening, setInput, setIsTyping]);

  const toggleSpeechRecognition = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      finalTranscriptRef.current = "";
      startListening();
    }
  }, [startListening, stopListening]);

  return {
    isListening,
    speechSupported,
    toggleSpeechRecognition,
  };
}

