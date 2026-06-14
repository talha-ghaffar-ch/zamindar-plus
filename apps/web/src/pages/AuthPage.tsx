import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { FieldLabel } from '../components/FieldLabel';
import {
  forgotPassword,
  googleLogin,
  login,
  resendVerification,
  resetPassword,
  signup,
  verifyEmail,
  type AuthResponse,
  type CreateUserPayload,
  type LoginPayload,
} from '../lib/api';

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleButtonText = 'signin_with' | 'signup_with';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme: 'outline';
              size: 'large';
              type: 'standard';
              shape: 'pill';
              text: GoogleButtonText;
              width: number;
            },
          ) => void;
        };
      };
    };
  }
}

type AuthPageProps = {
  onAuthenticated: (authResponse: AuthResponse) => void;
  onNotify: (message: string) => void;
};

type AuthMode = 'login' | 'signup' | 'verify' | 'forgot' | 'reset';

const initialSignupForm: CreateUserPayload = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  farmerType: 'Land Owner',
};

const initialLoginForm: LoginPayload = {
  email: '',
  password: '',
};
const initialForgotPasswordForm = {
  email: '',
};
const initialResetPasswordForm = {
  password: '',
  confirmPassword: '',
};
const GOOGLE_SCRIPT_ID = 'google-identity-services-script';
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFICATION_RESEND_ATTEMPTS = 4;
let initializedGoogleClientId = '';
let activeGoogleCredentialHandler:
  | ((response: GoogleCredentialResponse) => void)
  | null = null;

function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts.id) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(
      GOOGLE_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error()), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error()), { once: true });
    document.head.append(script);
  });
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.52Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.89 6.62-2.42l-3.23-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.08v2.59A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.41 13.9A6.01 6.01 0 0 1 6.1 12c0-.66.11-1.3.31-1.9V7.51H3.08A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.49l3.33-2.59Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.98c1.47 0 2.78.5 3.82 1.49l2.87-2.87C16.95 2.98 14.69 2 12 2a10 10 0 0 0-8.92 5.51l3.33 2.59C7.2 7.74 9.4 5.98 12 5.98Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function getAuthTitle(mode: AuthMode) {
  if (mode === 'login') return 'Sign in';
  if (mode === 'signup') return 'Create account';
  if (mode === 'verify') return 'Verify account';
  if (mode === 'forgot') return 'Reset password';

  return 'Set new password';
}

function getAuthDescription(mode: AuthMode) {
  if (mode === 'login') {
    return 'Open your farm dashboard and continue from your latest records.';
  }

  if (mode === 'signup') {
    return 'Create a farmer account connected to the shared backend.';
  }

  if (mode === 'verify') {
    return 'Enter the verification code to complete your account setup.';
  }

  if (mode === 'forgot') {
    return 'Enter your account email and we will send a password reset code.';
  }

  return 'Enter the code from your email and choose a strong new password.';
}

export function AuthPage({ onAuthenticated, onNotify }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const emailDeliveryEnabled =
    import.meta.env.VITE_EMAIL_DELIVERY_ENABLED === 'true';
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [forgotPasswordForm, setForgotPasswordForm] = useState(
    initialForgotPasswordForm,
  );
  const [resetPasswordForm, setResetPasswordForm] = useState(
    initialResetPasswordForm,
  );
  const [resetToken, setResetToken] = useState('');
  const [pendingPasswordResetEmail, setPendingPasswordResetEmail] = useState('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [localVerificationCode, setLocalVerificationCode] = useState('');
  const [localPasswordResetCode, setLocalPasswordResetCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState(false);
  const [isSignupPasswordVisible, setIsSignupPasswordVisible] = useState(false);
  const [isResetPasswordVisible, setIsResetPasswordVisible] = useState(false);
  const isLoginReady =
    loginForm.email.trim().length > 0 && loginForm.password.length >= 8;
  const isSignupReady =
    signupForm.firstName.trim().length >= 2 &&
    signupForm.lastName.trim().length >= 2 &&
    signupForm.email.trim().length > 0 &&
    signupForm.password.length >= 8;
  const isVerificationReady = verificationCode.trim().length >= 6;
  const isForgotPasswordReady = forgotPasswordForm.email.trim().length > 0;
  const isResetPasswordReady =
    resetToken.trim().length >= 6 &&
    resetPasswordForm.password.length >= 8 &&
    resetPasswordForm.password === resetPasswordForm.confirmPassword;

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      setError('');
      setSuccess('');

      if (!response.credential) {
        setError('Google did not return a valid sign-in credential.');
        return;
      }

      setIsSaving(true);

      try {
        onAuthenticated(await googleLogin({ credential: response.credential }));
      } catch (googleError) {
        const message =
          googleError instanceof Error
            ? googleError.message
            : 'Google sign-in failed.';
        setError(message);

        if (message.toLowerCase().includes('not configured')) {
          onNotify('Google sign-in will be available soon.');
        }
      } finally {
        setIsSaving(false);
      }
    },
    [onAuthenticated, onNotify],
  );

  useEffect(() => {
    activeGoogleCredentialHandler = handleGoogleCredential;

    return () => {
      activeGoogleCredentialHandler = null;
    };
  }, [handleGoogleCredential]);

  useEffect(() => {
    if (mode !== 'verify' || resendCooldown <= 0) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setResendCooldown((currentCooldown) => Math.max(currentCooldown - 1, 0));
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [mode, resendCooldown]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const verificationToken = searchParams.get('verifyEmail');

    if (!verificationToken) {
      return;
    }

    searchParams.delete('verifyEmail');
    const nextSearch = searchParams.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;

    window.history.replaceState({}, document.title, nextUrl);
    const verifyTimer = window.setTimeout(() => {
      if (!verificationToken) {
        return;
      }

      setMode('login');
      setError('');
      setSuccess('');
      setIsSaving(true);

      void verifyEmail({ token: verificationToken })
        .then((response) => {
          setSuccess(response.message);
          onNotify('Email verified successfully');
        })
        .catch((verificationError) => {
          setError(
            verificationError instanceof Error
              ? verificationError.message
              : 'Email verification failed.',
          );
        })
        .finally(() => setIsSaving(false));
    }, 0);

    return () => {
      window.clearTimeout(verifyTimer);
    };
  }, [onNotify]);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return;
    }

    let isCancelled = false;
    const buttonElement = googleButtonRef.current;
    buttonElement.replaceChildren();

    void loadGoogleIdentityScript()
      .then(() => {
        if (isCancelled || !window.google?.accounts.id) {
          return;
        }

        if (initializedGoogleClientId !== googleClientId) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => activeGoogleCredentialHandler?.(response),
          });
          initializedGoogleClientId = googleClientId;
        }

        buttonElement.replaceChildren();
        window.google.accounts.id.renderButton(buttonElement, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          text: mode === 'login' ? 'signin_with' : 'signup_with',
          width: Math.min(buttonElement.clientWidth || 360, 400),
        });
      })
      .catch(() => {
        if (!isCancelled) {
          setError('Google sign-in could not load. Check your internet connection.');
        }
      });

    return () => {
      isCancelled = true;
      buttonElement.replaceChildren();
    };
  }, [googleClientId, mode]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setShowForgotPassword(false);
    setIsSaving(true);

    try {
      onAuthenticated(await login(loginForm));
    } catch (loginError) {
      const message =
        loginError instanceof Error ? loginError.message : 'Login failed.';
      setError(message);
      setShowForgotPassword(
        message.toLowerCase().includes('invalid email or password'),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const createdEmail = signupForm.email.trim();
      const response = await signup({
        ...signupForm,
        email: createdEmail,
        phone: signupForm.phone || undefined,
        farmerType: signupForm.farmerType || undefined,
      });

      setPendingVerificationEmail(createdEmail);
      setVerificationCode('');
      setLocalVerificationCode(response.devVerificationToken ?? '');
      setResendAttempts(0);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setSignupForm(initialSignupForm);
      setLoginForm({
        email: createdEmail,
        password: '',
      });
      setMode('verify');
      setSuccess(response.message);
      onNotify('Account created successfully. Verify your email to continue.');
    } catch (signupError) {
      setError(
        signupError instanceof Error ? signupError.message : 'Signup failed.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleVerifyAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await verifyEmail({ token: verificationCode.trim() });
      setVerificationCode('');
      setLocalVerificationCode('');
      setPendingVerificationEmail('');
      setResendCooldown(0);
      setResendAttempts(0);
      setMode('login');
      setSuccess(response.message);
      onNotify('Email verified successfully');
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : 'Email verification failed.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleGooglePlaceholder() {
    setSuccess('');
    setError('Google sign-in will be available soon.');
    onNotify('Google sign-in will be available soon.');
  }

  async function handleResendVerification() {
    if (!pendingVerificationEmail) {
      setError('Create an account first, then request a new verification code.');
      return;
    }

    if (resendAttempts >= MAX_VERIFICATION_RESEND_ATTEMPTS) {
      setError('Verification resend limit reached. Try again later.');
      return;
    }

    setError('');
    setSuccess('');
    setIsResendingVerification(true);

    try {
      const response = await resendVerification({
        email: pendingVerificationEmail,
      });
      setLocalVerificationCode(response.devVerificationToken ?? '');
      setResendAttempts((currentAttempts) => currentAttempts + 1);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setSuccess(response.message);
      onNotify('Verification code refreshed');
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : 'Verification code could not be refreshed.',
      );
    } finally {
      setIsResendingVerification(false);
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!emailDeliveryEnabled) {
      setError('Password reset email delivery will be available soon.');
      onNotify('Password reset will be available soon.');
      return;
    }

    setIsSaving(true);

    try {
      const resetEmail = forgotPasswordForm.email.trim();
      const response = await forgotPassword({
        email: resetEmail,
      });
      setPendingPasswordResetEmail(resetEmail);
      setResetToken(response.devVerificationToken ?? '');
      setLocalPasswordResetCode(response.devVerificationToken ?? '');
      setResetPasswordForm(initialResetPasswordForm);
      setMode('reset');
      setSuccess(response.message);
      onNotify('Password reset code sent');
    } catch (forgotError) {
      setError(
        forgotError instanceof Error
          ? forgotError.message
          : 'Password reset email could not be sent.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await resetPassword({
        token: resetToken.trim(),
        password: resetPasswordForm.password,
      });
      setResetToken('');
      setPendingPasswordResetEmail('');
      setLocalPasswordResetCode('');
      setResetPasswordForm(initialResetPasswordForm);
      setMode('login');
      setSuccess(response.message);
      onNotify('Password reset successfully');
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : 'Password reset failed.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function openForgotPassword() {
    setForgotPasswordForm({
      email: loginForm.email,
    });
    switchMode('forgot');
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setShowForgotPassword(false);

    if (nextMode !== 'reset') {
      setResetToken('');
      setPendingPasswordResetEmail('');
      setLocalPasswordResetCode('');
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="auth-hero">
          <div className="auth-hero-copy">
            <h1 className="auth-logo" aria-label="Zamindar Plus">
              <span>Zamindar</span>
              <span>Plus</span>
            </h1>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <p className="eyebrow">Secure access</p>
            <h2>{getAuthTitle(mode)}</h2>
            <p>{getAuthDescription(mode)}</p>
          </div>

          <div className="auth-status-row">
            <span>
              <ShieldCheck size={14} aria-hidden="true" />
              Secure session
            </span>
            <span>
              <BarChart3 size={14} aria-hidden="true" />
              Profit reports
            </span>
            <span>
              <BadgeCheck size={14} aria-hidden="true" />
              Private data
            </span>
          </div>

          {mode === 'login' || mode === 'signup' ? (
            <>
              <div className="segmented-control" aria-label="Authentication mode">
                <button
                  className={mode === 'login' ? 'active' : ''}
                  aria-pressed={mode === 'login'}
                  type="button"
                  onClick={() => switchMode('login')}
                >
                  <LogIn size={15} aria-hidden="true" />
                  Sign in
                </button>
                <button
                  className={mode === 'signup' ? 'active' : ''}
                  aria-pressed={mode === 'signup'}
                  type="button"
                  onClick={() => switchMode('signup')}
                >
                  <UserPlus size={15} aria-hidden="true" />
                  Create account
                </button>
              </div>

              {googleClientId ? (
                <div className="google-auth-render" ref={googleButtonRef} />
              ) : (
                <button
                  className="google-auth-button"
                  type="button"
                  onClick={handleGooglePlaceholder}
                >
                  <GoogleIcon />
                  {mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
                </button>
              )}
            </>
          ) : (
            <button
              className="text-button auth-back-button"
              type="button"
              onClick={() => switchMode(mode === 'verify' ? 'signup' : 'login')}
            >
              <ArrowLeft size={15} aria-hidden="true" />
              {mode === 'verify' ? 'Back to create account' : 'Back to sign in'}
            </button>
          )}

          {error ? <p className="error">{error}</p> : null}
          {success ? <p className="success">{success}</p> : null}

          {mode === 'login' ? (
            <form className="form-grid auth-form" onSubmit={handleLogin}>
              <label>
                <FieldLabel required>Email</FieldLabel>
                <input
                  required
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => {
                    setShowForgotPassword(false);
                    setLoginForm({ ...loginForm, email: event.target.value });
                  }}
                />
              </label>

              <label>
                <FieldLabel required>Password</FieldLabel>
                <span className="password-field">
                  <input
                    required
                    minLength={8}
                    type={isLoginPasswordVisible ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(event) => {
                      setShowForgotPassword(false);
                      setLoginForm({
                        ...loginForm,
                        password: event.target.value,
                      });
                    }}
                  />
                  <button
                    aria-label={
                      isLoginPasswordVisible ? 'Hide password' : 'Show password'
                    }
                    className="password-toggle"
                    type="button"
                    onClick={() =>
                      setIsLoginPasswordVisible((isVisible) => !isVisible)
                    }
                  >
                    {isLoginPasswordVisible ? (
                      <EyeOff size={17} aria-hidden="true" />
                    ) : (
                      <Eye size={17} aria-hidden="true" />
                    )}
                  </button>
                </span>
              </label>

              <button
                className={
                  isLoginReady
                    ? 'primary-button auth-submit-button is-ready'
                    : 'primary-button auth-submit-button'
                }
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'Signing in...' : 'Sign in'}
              </button>

              {showForgotPassword ? (
                <button
                  className="text-button auth-link-button"
                  disabled={isSaving}
                  type="button"
                  onClick={openForgotPassword}
                >
                  <KeyRound size={15} aria-hidden="true" />
                  Forgot password?
                </button>
              ) : null}
            </form>
          ) : null}

          {mode === 'signup' ? (
            <form className="form-grid auth-form signup-form" onSubmit={handleSignup}>
              <label>
                <FieldLabel required>First name</FieldLabel>
                <input
                  required
                  minLength={2}
                  value={signupForm.firstName}
                  onChange={(event) =>
                    setSignupForm({
                      ...signupForm,
                      firstName: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                <FieldLabel required>Last name</FieldLabel>
                <input
                  required
                  minLength={2}
                  value={signupForm.lastName}
                  onChange={(event) =>
                    setSignupForm({ ...signupForm, lastName: event.target.value })
                  }
                />
              </label>

              <label>
                <FieldLabel required>Email</FieldLabel>
                <input
                  required
                  type="email"
                  value={signupForm.email}
                  onChange={(event) =>
                    setSignupForm({ ...signupForm, email: event.target.value })
                  }
                />
              </label>

              <label>
                <FieldLabel>Phone</FieldLabel>
                <input
                  value={signupForm.phone}
                  onChange={(event) =>
                    setSignupForm({ ...signupForm, phone: event.target.value })
                  }
                />
              </label>

              <label>
                <FieldLabel required>Password</FieldLabel>
                <span className="password-field">
                  <input
                    required
                    minLength={8}
                    type={isSignupPasswordVisible ? 'text' : 'password'}
                    value={signupForm.password}
                    onChange={(event) =>
                      setSignupForm({ ...signupForm, password: event.target.value })
                    }
                  />
                  <button
                    aria-label={
                      isSignupPasswordVisible ? 'Hide password' : 'Show password'
                    }
                    className="password-toggle"
                    type="button"
                    onClick={() =>
                      setIsSignupPasswordVisible((isVisible) => !isVisible)
                    }
                  >
                    {isSignupPasswordVisible ? (
                      <EyeOff size={17} aria-hidden="true" />
                    ) : (
                      <Eye size={17} aria-hidden="true" />
                    )}
                  </button>
                </span>
              </label>

              <label>
                <FieldLabel>Farmer type</FieldLabel>
                <select
                  value={signupForm.farmerType}
                  onChange={(event) =>
                    setSignupForm({
                      ...signupForm,
                      farmerType: event.target.value,
                    })
                  }
                >
                  <option value="Land Owner">Land owner</option>
                  <option value="Thekka Farmer">Thekka farmer</option>
                  <option value="Batai Farmer">Batai farmer</option>
                  <option value="Family Member">Family member</option>
                  <option value="Farm Manager">Farm manager</option>
                </select>
              </label>

              <button
                className={
                  isSignupReady
                    ? 'primary-button auth-submit-button is-ready'
                    : 'primary-button auth-submit-button'
                }
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'Creating...' : 'Create account'}
              </button>
            </form>
          ) : null}

          {mode === 'verify' ? (
            <form className="form-grid auth-form" onSubmit={handleVerifyAccount}>
              <div className="verification-mailbox">
                <MailCheck size={20} aria-hidden="true" />
                <span>
                  Verification pending for <strong>{pendingVerificationEmail}</strong>
                </span>
              </div>

              {localVerificationCode ? (
                <p className="local-verification-note">
                  Local test code: <strong>{localVerificationCode}</strong>
                </p>
              ) : null}

              <label>
                <FieldLabel required>Verification code</FieldLabel>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  minLength={6}
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(event) =>
                    setVerificationCode(
                      event.target.value.replace(/\D/g, '').slice(0, 6),
                    )
                  }
                />
              </label>

              <button
                className={
                  isVerificationReady
                    ? 'primary-button auth-submit-button is-ready'
                    : 'primary-button auth-submit-button'
                }
                disabled={isSaving}
                type="submit"
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                {isSaving ? 'Verifying...' : 'Verify account'}
              </button>

              {resendCooldown > 0 ? (
                <p className="verification-cooldown">
                  Resend verification email available in {resendCooldown}s.
                </p>
              ) : resendAttempts < MAX_VERIFICATION_RESEND_ATTEMPTS ? (
                <button
                  className="resend-verification-button is-ready"
                  disabled={isResendingVerification}
                  type="button"
                  onClick={handleResendVerification}
                >
                  <RefreshCw size={15} aria-hidden="true" />
                  {isResendingVerification
                    ? 'Refreshing code...'
                    : 'Resend verification email'}
                </button>
              ) : (
                <p className="verification-cooldown">
                  Resend limit reached. Try signing up again later.
                </p>
              )}
            </form>
          ) : null}

          {mode === 'forgot' ? (
            <form className="form-grid auth-form" onSubmit={handleForgotPassword}>
              {!emailDeliveryEnabled ? (
                <p className="feature-soon-note">
                  This feature will be available after email service setup.
                </p>
              ) : null}
              <label>
                <FieldLabel required>Email</FieldLabel>
                <input
                  required
                  type="email"
                  value={forgotPasswordForm.email}
                  onChange={(event) =>
                    setForgotPasswordForm({
                      email: event.target.value,
                    })
                  }
                />
              </label>

              <button
                className={
                  isForgotPasswordReady
                    ? 'primary-button auth-submit-button is-ready'
                    : 'primary-button auth-submit-button'
                }
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'Sending...' : 'Send reset code'}
              </button>
            </form>
          ) : null}

          {mode === 'reset' ? (
            <form className="form-grid auth-form" onSubmit={handleResetPassword}>
              {pendingPasswordResetEmail ? (
                <div className="verification-mailbox">
                  <MailCheck size={20} aria-hidden="true" />
                  <span>
                    Reset code sent to <strong>{pendingPasswordResetEmail}</strong>
                  </span>
                </div>
              ) : null}

              {localPasswordResetCode ? (
                <p className="local-verification-note">
                  Local test code: <strong>{localPasswordResetCode}</strong>
                </p>
              ) : null}

              <label>
                <FieldLabel required>Reset code</FieldLabel>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  minLength={6}
                  placeholder="Enter 6-digit code"
                  value={resetToken}
                  onChange={(event) =>
                    setResetToken(
                      event.target.value.replace(/\D/g, '').slice(0, 6),
                    )
                  }
                />
              </label>

              <label>
                <FieldLabel required>New password</FieldLabel>
                <span className="password-field">
                  <input
                    required
                    minLength={8}
                    type={isResetPasswordVisible ? 'text' : 'password'}
                    value={resetPasswordForm.password}
                    onChange={(event) =>
                      setResetPasswordForm({
                        ...resetPasswordForm,
                        password: event.target.value,
                      })
                    }
                  />
                  <button
                    aria-label={
                      isResetPasswordVisible ? 'Hide password' : 'Show password'
                    }
                    className="password-toggle"
                    type="button"
                    onClick={() =>
                      setIsResetPasswordVisible((isVisible) => !isVisible)
                    }
                  >
                    {isResetPasswordVisible ? (
                      <EyeOff size={17} aria-hidden="true" />
                    ) : (
                      <Eye size={17} aria-hidden="true" />
                    )}
                  </button>
                </span>
              </label>

              <label>
                <FieldLabel required>Confirm password</FieldLabel>
                <input
                  required
                  minLength={8}
                  type={isResetPasswordVisible ? 'text' : 'password'}
                  value={resetPasswordForm.confirmPassword}
                  onChange={(event) =>
                    setResetPasswordForm({
                      ...resetPasswordForm,
                      confirmPassword: event.target.value,
                    })
                  }
                />
              </label>

              <button
                className={
                  isResetPasswordReady
                    ? 'primary-button auth-submit-button is-ready'
                    : 'primary-button auth-submit-button'
                }
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}
