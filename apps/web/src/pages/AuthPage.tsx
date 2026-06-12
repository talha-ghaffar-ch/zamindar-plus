import { type FormEvent, useState } from 'react';
import {
  BadgeCheck,
  BarChart3,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { FieldLabel } from '../components/FieldLabel';
import {
  login,
  signup,
  type AuthResponse,
  type CreateUserPayload,
  type LoginPayload,
} from '../lib/api';

type AuthPageProps = {
  onAuthenticated: (authResponse: AuthResponse) => void;
  onNotify: (message: string) => void;
};

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

export function AuthPage({ onAuthenticated, onNotify }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState(false);
  const [isSignupPasswordVisible, setIsSignupPasswordVisible] = useState(false);
  const isLoginReady =
    loginForm.email.trim().length > 0 && loginForm.password.length >= 8;
  const isSignupReady =
    signupForm.firstName.trim().length >= 2 &&
    signupForm.lastName.trim().length >= 2 &&
    signupForm.email.trim().length > 0 &&
    signupForm.password.length >= 8;

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      onAuthenticated(await login(loginForm));
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
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
      await signup({
        ...signupForm,
        phone: signupForm.phone || undefined,
        farmerType: signupForm.farmerType || undefined,
      });
      setSignupForm(initialSignupForm);
      setLoginForm({
        email: signupForm.email,
        password: '',
      });
      setMode('login');
      setSuccess('Account Created Successfully. Please Sign In To Continue.');
      onNotify('Account Created Successfully');
    } catch (signupError) {
      setError(
        signupError instanceof Error ? signupError.message : 'Signup failed.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleGooglePlaceholder() {
    setSuccess('');
    setError('Google sign-in will be connected after the Google Client ID is configured.');
  }

  function switchMode(nextMode: 'login' | 'signup') {
    setMode(nextMode);
    setError('');
    setSuccess('');
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
            <p className="eyebrow">Secure Access</p>
            <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
            <p>
              {mode === 'login'
                ? 'Open your farm dashboard and continue from your latest records.'
                : 'Create a farmer account connected to the shared backend.'}
            </p>
          </div>

          <div className="auth-status-row">
            <span>
              <ShieldCheck size={14} aria-hidden="true" />
              Secure Session
            </span>
            <span>
              <BarChart3 size={14} aria-hidden="true" />
              Profit Reports
            </span>
            <span>
              <BadgeCheck size={14} aria-hidden="true" />
              Private Data
            </span>
          </div>

          <div className="segmented-control" aria-label="Authentication mode">
            <button
              className={mode === 'login' ? 'active' : ''}
              aria-pressed={mode === 'login'}
              type="button"
              onClick={() => switchMode('login')}
            >
              <LogIn size={15} aria-hidden="true" />
              Sign In
            </button>
            <button
              className={mode === 'signup' ? 'active' : ''}
              aria-pressed={mode === 'signup'}
              type="button"
              onClick={() => switchMode('signup')}
            >
              <UserPlus size={15} aria-hidden="true" />
              Create Account
            </button>
          </div>

          <button
            className="google-auth-button"
            type="button"
            onClick={handleGooglePlaceholder}
          >
            <GoogleIcon />
            {mode === 'login' ? 'Sign In With Google' : 'Sign Up With Google'}
          </button>

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
                  onChange={(event) =>
                    setLoginForm({ ...loginForm, email: event.target.value })
                  }
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
                    onChange={(event) =>
                      setLoginForm({ ...loginForm, password: event.target.value })
                    }
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
                {isSaving ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form className="form-grid auth-form signup-form" onSubmit={handleSignup}>
              <label>
                <FieldLabel required>First Name</FieldLabel>
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
                <FieldLabel required>Last Name</FieldLabel>
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
                <FieldLabel>Farmer Type</FieldLabel>
                <select
                  value={signupForm.farmerType}
                  onChange={(event) =>
                    setSignupForm({
                      ...signupForm,
                      farmerType: event.target.value,
                    })
                  }
                >
                  <option>Land Owner</option>
                  <option>Thekka Farmer</option>
                  <option>Batai Farmer</option>
                  <option>Family Member</option>
                  <option>Farm Manager</option>
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
                {isSaving ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
