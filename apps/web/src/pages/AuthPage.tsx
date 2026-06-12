import { type FormEvent, useState } from 'react';
import { Activity, LogIn, ShieldCheck, Sprout, UserPlus } from 'lucide-react';
import {
  login,
  signup,
  type AuthResponse,
  type CreateUserPayload,
  type LoginPayload,
} from '../lib/api';

type AuthPageProps = {
  onAuthenticated: (authResponse: AuthResponse) => void;
};

const initialSignupForm: CreateUserPayload = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  farmerType: 'Land owner',
};

const initialLoginForm: LoginPayload = {
  email: '',
  password: '',
};

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
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
    setIsSaving(true);

    try {
      onAuthenticated(
        await signup({
          ...signupForm,
          phone: signupForm.phone || undefined,
          farmerType: signupForm.farmerType || undefined,
        }),
      );
    } catch (signupError) {
      setError(
        signupError instanceof Error ? signupError.message : 'Signup failed.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="auth-visual" aria-hidden="true">
          <div className="auth-visual-mark">
            <Sprout size={34} />
          </div>
          <div className="auth-pulse-card">
            <span>Ledger online</span>
            <strong>98%</strong>
          </div>
          <div className="auth-signal-grid">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="auth-brand">
          <p className="eyebrow">Zamindar Plus</p>
          <h1>Farm ledger workspace</h1>
          <div className="auth-status-row">
            <span>
              <ShieldCheck size={14} aria-hidden="true" />
              Secure session
            </span>
            <span>
              <Activity size={14} aria-hidden="true" />
              Live reports
            </span>
          </div>
        </div>

        <div className="segmented-control" aria-label="Authentication mode">
          <button
            className={mode === 'login' ? 'active' : ''}
            type="button"
            onClick={() => setMode('login')}
          >
            <LogIn size={15} aria-hidden="true" />
            Sign In
          </button>
          <button
            className={mode === 'signup' ? 'active' : ''}
            type="button"
            onClick={() => setMode('signup')}
          >
            <UserPlus size={15} aria-hidden="true" />
            Create Account
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}

        {mode === 'login' ? (
          <form className="form-grid" onSubmit={handleLogin}>
            <label>
              Email
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
              Password
              <input
                required
                minLength={8}
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, password: event.target.value })
                }
              />
            </label>

            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form className="form-grid" onSubmit={handleSignup}>
            <label>
              First Name
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
              Last Name
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
              Email
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
              Phone
              <input
                value={signupForm.phone}
                onChange={(event) =>
                  setSignupForm({ ...signupForm, phone: event.target.value })
                }
              />
            </label>

            <label>
              Password
              <input
                required
                minLength={8}
                type="password"
                value={signupForm.password}
                onChange={(event) =>
                  setSignupForm({ ...signupForm, password: event.target.value })
                }
              />
            </label>

            <label>
              Farmer Type
              <select
                value={signupForm.farmerType}
                onChange={(event) =>
                  setSignupForm({
                    ...signupForm,
                    farmerType: event.target.value,
                  })
                }
              >
                <option>Land owner</option>
                <option>Thekka farmer</option>
                <option>Batai farmer</option>
                <option>Family member</option>
                <option>Farm manager</option>
              </select>
            </label>

            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
