import { useEffect, useRef, useState, useCallback } from "react";

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  speechSupported: boolean;
  toggleSpeechRecognition: () => void;
}

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

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
      isListeningRef.current = true;
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
        console.error('Speech recognition error', event.error);
        stopListening();
      };

      recognitionRef.current.onend = () => {
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

