"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { voiceApi } from "@/lib/api-client";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface VoiceCommandResult {
  status: string;
  parsed?: {
    intent: string;
    action: object;
    confidence: number;
    requires_confirmation: boolean;
    suggested_response: string;
    clarification_needed: string | null;
  };
  command_id?: number;
  message?: string;
  balance?: number;
}

export function useVoice(currentScreen: string = "dashboard") {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [result, setResult] = useState<VoiceCommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "es-AR"; // Spanish (Argentina)

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (final) {
          setTranscript((prev) => prev + final);
        }
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: Event) => {
        console.error("Speech recognition error:", event);
        setError("Error de reconocimiento de voz");
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    setTranscript("");
    setInterimTranscript("");
    setResult(null);
    setError(null);

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setError("No se pudo iniciar el reconocimiento de voz");
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsListening(false);

    const finalTranscript = transcript + interimTranscript;
    setInterimTranscript("");

    if (finalTranscript.trim()) {
      setIsProcessing(true);
      try {
        const response = await voiceApi.process(finalTranscript, {
          current_screen: currentScreen,
        });
        setResult(response as VoiceCommandResult);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error procesando comando",
        );
      } finally {
        setIsProcessing(false);
      }
    }
  }, [transcript, interimTranscript, currentScreen]);

  const executeCommand = useCallback(
    async (confirm: boolean, updates?: object) => {
      if (!result?.command_id) return;

      setIsProcessing(true);
      try {
        const response = await voiceApi.execute(
          result.command_id,
          confirm,
          updates,
        );
        setResult(response as VoiceCommandResult);
        return response;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error ejecutando comando",
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [result],
  );

  const reset = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setResult(null);
    setError(null);
  }, []);

  return {
    isListening,
    isProcessing,
    isSupported,
    transcript,
    interimTranscript,
    result,
    error,
    startListening,
    stopListening,
    executeCommand,
    reset,
  };
}
