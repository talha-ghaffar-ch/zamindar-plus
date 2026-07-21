import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@zamindar/shared';

/**
 * Voice input built on the browser's Web Speech API. Nothing is uploaded by the
 * app itself — the browser performs the transcription and hands back text.
 */

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Speech locales: Urdu speech for Urdu, Pakistani English otherwise. */
const SPEECH_LANG: Record<Locale, string> = {
  ur: 'ur-PK',
  roman: 'en-PK',
  en: 'en-PK',
};

export type SpeechInput = {
  isSupported: boolean;
  isListening: boolean;
  /** Live partial transcript while the user is still speaking. */
  interimText: string;
  error: string;
  start: () => void;
  stop: () => void;
};

export function useSpeechInput({
  locale,
  onResult,
}: {
  locale: Locale;
  onResult: (transcript: string) => void;
}): SpeechInput {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const isSupported = getRecognitionConstructor() !== null;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Constructor = getRecognitionConstructor();
    if (!Constructor) {
      return;
    }

    // Restarting cleanly avoids stale handlers when the language changes.
    recognitionRef.current?.abort();

    const recognition = new Constructor();
    recognition.lang = SPEECH_LANG[locale];
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimText(interim);

      if (finalText.trim()) {
        onResultRef.current(finalText.trim());
        setInterimText('');
      }
    };

    recognition.onerror = (event) => {
      setError(event.error ?? 'speech-error');
      setIsListening(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    setError('');
    setInterimText('');
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, [locale]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { isSupported, isListening, interimText, error, start, stop };
}
