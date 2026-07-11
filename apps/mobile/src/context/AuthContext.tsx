import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import * as api from '../api';
import {GOOGLE_WEB_CLIENT_ID} from '../config';

type Status = 'loading' | 'authed' | 'guest';

type AuthContextValue = {
  status: Status;
  user: api.User | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  applySession: (res: api.AuthResponse) => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

let googleConfigured = false;
function configureGoogle() {
  if (googleConfigured) {
    return;
  }
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  googleConfigured = true;
}

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<api.User | null>(null);

  useEffect(() => {
    configureGoogle();
    (async () => {
      try {
        const token = await api.initAuthToken();
        if (!token) {
          setStatus('guest');
          return;
        }
        const me = await api.getMe();
        setUser(me);
        setStatus('authed');
      } catch {
        await api.clearAuthToken();
        setUser(null);
        setStatus('guest');
      }
    })();
  }, []);

  const applySession = useCallback(async (res: api.AuthResponse) => {
    await api.setAuthToken(res.accessToken);
    setUser(res.user);
    setStatus('authed');
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email.trim(), password);
      await applySession(res);
    },
    [applySession],
  );

  const signInWithGoogle = useCallback(async () => {
    configureGoogle();
    await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
    const response = await GoogleSignin.signIn();
    // v13+ returns { type, data: { idToken } }; older returns { idToken }.
    const idToken =
      (response as any)?.data?.idToken ?? (response as any)?.idToken ?? null;
    if (!idToken) {
      throw new api.ApiError('Google sign-in was cancelled.', 0);
    }
    const res = await api.googleLogin(idToken);
    await applySession(res);
  }, [applySession]);

  const refreshUser = useCallback(async () => {
    const me = await api.getMe();
    setUser(me);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // ignore — user may not have used Google
    }
    await api.clearAuthToken();
    setUser(null);
    setStatus('guest');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      signInWithPassword,
      signInWithGoogle,
      applySession,
      refreshUser,
      signOut,
    }),
    [status, user, signInWithPassword, signInWithGoogle, applySession, refreshUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
