import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@zamindar/shared';

/**
 * Voice input built on the browser's Web Speech API. Nothing is uploaded by the
 * app itself — the browser performs the transcription and hands back text.
 *
 * The recogniser keeps listening across natural pauses and only reports the
 * finished transcript when the user stops, so a mid-sentence pause never cuts
 * the message off or sends it early.
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

// The browser ends a recognition session after a silence; restart it so the
// user can pause to think. Capped so a forgotten-open mic eventually stops.
const MAX_SILENCE_RESTARTS = 40;

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export type SpeechInput = {
  isSupported: boolean;
  isListening: boolean;
  /** Live transcript accumulated so far while the user is speaking. */
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
  // True while the user wants to keep dictating (until they tap stop).
  const wantListeningRef = useRef(false);
  // Finalised text from earlier sub-sessions (before silence restarts).
  const committedRef = useRef('');
  // Finalised and interim text within the current sub-session.
  const sessionFinalRef = useRef('');
  const sessionInterimRef = useRef('');
  const restartsRef = useRef(0);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const isSupported = getRecognitionConstructor() !== null;

  const buildTranscript = useCallback(
    () =>
      collapse(
        `${committedRef.current} ${sessionFinalRef.current} ${sessionInterimRef.current}`,
      ),
    [],
  );

  const finalize = useCallback(() => {
    const full = collapse(
      `${committedRef.current} ${sessionFinalRef.current}`,
    );
    committedRef.current = '';
    sessionFinalRef.current = '';
    sessionInterimRef.current = '';
    restartsRef.current = 0;
    setIsListening(false);
    setInterimText('');
    if (full) {
      onResultRef.current(full);
    }
  }, []);

  const startSession = useCallback(() => {
    const Constructor = getRecognitionConstructor();
    if (!Constructor) {
      return;
    }

    const recognition = new Constructor();
    recognition.lang = SPEECH_LANG[locale];
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          finalText += `${transcript} `;
        } else {
          interim += `${transcript} `;
        }
      }
      sessionFinalRef.current = finalText;
      sessionInterimRef.current = interim;
      // Real speech arrived, so this is not an idle mic — reset the silence cap.
      if (finalText.trim()) {
        restartsRef.current = 0;
      }
      setInterimText(buildTranscript());
    };

    recognition.onerror = (event) => {
      const code = event.error ?? 'speech-error';
      // Silence and self-aborts are expected between sub-sessions; keep going.
      if (code === 'no-speech' || code === 'aborted') {
        return;
      }
      wantListeningRef.current = false;
      setError(code);
    };

    recognition.onend = () => {
      // Carry this sub-session's final text into the running transcript.
      committedRef.current = collapse(
        `${committedRef.current} ${sessionFinalRef.current}`,
      );
      sessionFinalRef.current = '';
      sessionInterimRef.current = '';

      // The user is still dictating: restart so a pause does not end the turn.
      if (
        wantListeningRef.current &&
        restartsRef.current < MAX_SILENCE_RESTARTS
      ) {
        restartsRef.current += 1;
        try {
          recognition.start();
          return;
        } catch {
          // Fall through to finalising if the engine refuses to restart.
        }
      }

      finalize();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      finalize();
    }
  }, [buildTranscript, finalize, locale]);

  const stop = useCallback(() => {
    // Stop wanting more audio; the pending onend will finalise and send.
    wantListeningRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (!getRecognitionConstructor()) {
      return;
    }
    recognitionRef.current?.abort();
    committedRef.current = '';
    sessionFinalRef.current = '';
    sessionInterimRef.current = '';
    restartsRef.current = 0;
    wantListeningRef.current = true;
    setError('');
    setInterimText('');
    setIsListening(true);
    startSession();
  }, [startSession]);

  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  return { isSupported, isListening, interimText, error, start, stop };
}
