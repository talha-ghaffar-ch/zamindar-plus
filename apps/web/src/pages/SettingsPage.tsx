import { type ChangeEvent, type FormEvent, useState } from 'react';
import {
  Bell,
  Camera,
  Eye,
  EyeOff,
  Image,
  KeyRound,
  Mail,
  Palette,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react';
import {
  deleteUser,
  updateUser,
  type UpdateUserPayload,
  type User,
} from '../lib/api';

type SettingsPageProps = {
  currentUser: User;
  onUserUpdated: (user: User) => void;
  onAccountDeleted: () => void;
};

function avatarMotif(motif: string) {
  if (motif === 'wheat') {
    return `
      <path d="M78 126V54" stroke="#fff8d7" stroke-width="8" stroke-linecap="round" />
      <path d="M78 68c-22-16-34-17-42-4 16 16 29 20 42 16Z" fill="#fff8d7" opacity=".88" />
      <path d="M82 82c24-13 37-12 42 3-18 14-32 16-42 8Z" fill="#fff8d7" opacity=".82" />
      <path d="M78 100c-22-13-35-12-42 2 17 14 30 17 42 8Z" fill="#fff8d7" opacity=".78" />
    `;
  }

  if (motif === 'tractor') {
    return `
      <circle cx="58" cy="108" r="20" fill="#fff8d7" opacity=".92" />
      <circle cx="112" cy="112" r="13" fill="#fff8d7" opacity=".9" />
      <path d="M46 92h58l11 20H36l10-20Z" fill="#ffffff" opacity=".7" />
      <path d="M72 70h30l9 22H70Z" fill="#fff8d7" opacity=".86" />
    `;
  }

  if (motif === 'canal') {
    return `
      <path d="M18 102c26-22 48-22 70 0s41 23 58 4v28H18Z" fill="#d7fbff" opacity=".82" />
      <path d="M20 72c22-14 43-14 63 0s37 14 57 0" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity=".84" />
      <circle cx="116" cy="42" r="18" fill="#fff1b6" opacity=".95" />
    `;
  }

  if (motif === 'barn') {
    return `
      <path d="M36 78 80 44l44 34v52H36Z" fill="#fff8d7" opacity=".9" />
      <path d="M58 92h44v38H58Z" fill="#ffffff" opacity=".58" />
      <path d="M36 78h88" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity=".72" />
    `;
  }

  if (motif === 'sunfield') {
    return `
      <circle cx="112" cy="48" r="24" fill="#fff1b6" opacity=".92" />
      <path d="M20 112c28-22 52-24 74-6s36 16 48 3v24H20Z" fill="#ffffff" opacity=".32" />
      <path d="M26 88h108M32 104h96" stroke="#fff8d7" stroke-width="7" stroke-linecap="round" opacity=".78" />
    `;
  }

  if (motif === 'cotton') {
    return `
      <path d="M80 128V86" stroke="#fff8d7" stroke-width="8" stroke-linecap="round" />
      <circle cx="64" cy="76" r="17" fill="#ffffff" opacity=".92" />
      <circle cx="84" cy="64" r="20" fill="#ffffff" opacity=".95" />
      <circle cx="104" cy="78" r="17" fill="#ffffff" opacity=".9" />
      <path d="M46 108c14-16 26-19 36-10-9 15-21 21-36 10Z" fill="#fff8d7" opacity=".72" />
    `;
  }

  if (motif === 'rice') {
    return `
      <path d="M42 124c28-52 56-70 84-82" fill="none" stroke="#fff8d7" stroke-width="8" stroke-linecap="round" />
      <path d="M72 92c-18-7-29-4-34 10 15 9 27 8 36-2Z" fill="#ffffff" opacity=".72" />
      <path d="M94 72c-18-7-29-4-34 10 15 9 27 8 36-2Z" fill="#ffffff" opacity=".78" />
      <path d="M112 56c-18-7-28-4-34 10 15 9 27 8 36-2Z" fill="#ffffff" opacity=".82" />
    `;
  }

  if (motif === 'sugarcane') {
    return `
      <path d="M58 126 76 42M88 126l16-76" stroke="#fff8d7" stroke-width="9" stroke-linecap="round" />
      <path d="M66 78c-22-5-35 2-40 19 20 7 35 2 45-14Z" fill="#ffffff" opacity=".58" />
      <path d="M92 88c23-6 37 1 42 18-20 8-36 3-46-13Z" fill="#ffffff" opacity=".62" />
    `;
  }

  if (motif === 'orchard') {
    return `
      <circle cx="78" cy="62" r="31" fill="#ffffff" opacity=".28" />
      <circle cx="58" cy="76" r="25" fill="#fff8d7" opacity=".7" />
      <circle cx="100" cy="78" r="27" fill="#ffffff" opacity=".48" />
      <path d="M80 84v44" stroke="#fff8d7" stroke-width="9" stroke-linecap="round" />
      <path d="M44 128h74" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity=".72" />
    `;
  }

  return `
    <path d="M32 116c18-26 43-40 76-42 12-.8 21 2 28 8-13 24-33 38-60 42-16 2.4-31-.3-44-8Z" fill="#ffffff" opacity="0.42" />
    <path d="M48 92c20-24 42-34 68-28" stroke="#fff8d7" stroke-width="8" stroke-linecap="round" opacity=".88" />
  `;
}

function makeAvatar(colors: [string, string, string], motif: string) {
  const [startColor, endColor, accentColor] = colors;

  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${startColor}" />
          <stop offset="1" stop-color="${endColor}" />
        </linearGradient>
        <filter id="soft">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <rect width="160" height="160" rx="36" fill="url(#bg)" />
      <circle cx="34" cy="34" r="34" fill="${accentColor}" opacity="0.38" filter="url(#soft)" />
      <circle cx="132" cy="122" r="44" fill="#ffffff" opacity="0.18" filter="url(#soft)" />
      ${avatarMotif(motif)}
    </svg>
  `)}`;
}

const DEFAULT_AVATAR_IMAGES = [
  {
    name: 'Emerald Field',
    value: makeAvatar(['#0f7a53', '#14a2a9', '#f1b457'], 'field'),
  },
  {
    name: 'Wheat Gold',
    value: makeAvatar(['#cf8f28', '#2d7a4e', '#ffe3a1'], 'wheat'),
  },
  {
    name: 'Canal Blue',
    value: makeAvatar(['#146c8c', '#20b17a', '#a5f3d1'], 'canal'),
  },
  {
    name: 'Soil Rose',
    value: makeAvatar(['#9f3f4d', '#7a5a22', '#ffd2a1'], 'barn'),
  },
  {
    name: 'Sun Field',
    value: makeAvatar(['#e2a538', '#13715a', '#fff1b6'], 'sunfield'),
  },
  {
    name: 'Cotton White',
    value: makeAvatar(['#315b6b', '#7a9f72', '#f7f7ec'], 'cotton'),
  },
  {
    name: 'Rice Green',
    value: makeAvatar(['#2d8a57', '#9abf3a', '#d6f7a8'], 'rice'),
  },
  {
    name: 'Sugarcane',
    value: makeAvatar(['#1d6b46', '#b18d32', '#f4dfa0'], 'sugarcane'),
  },
  {
    name: 'Orchard',
    value: makeAvatar(['#5a7f2c', '#1b8a75', '#ffd36e'], 'orchard'),
  },
  {
    name: 'Farm Tractor',
    value: makeAvatar(['#7f8f24', '#0f7772', '#f2c45f'], 'tractor'),
  },
];

function buildForm(user: User) {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? '',
    password: '',
    farmerType: user.farmerType ?? 'Land Owner',
    profileImageUrl: user.profileImageUrl ?? DEFAULT_AVATAR_IMAGES[0].value,
    preferredAreaUnit: user.preferredAreaUnit ?? 'Acre',
    preferredCurrency: user.preferredCurrency ?? 'PKR',
    preferredLanguage: user.preferredLanguage ?? 'English',
    dateFormat: user.dateFormat ?? 'DD/MM/YYYY',
    emailNotifications: user.emailNotifications ?? true,
    smsNotifications: user.smsNotifications ?? false,
    weeklyReport: user.weeklyReport ?? true,
  };
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export function SettingsPage({
  currentUser,
  onUserUpdated,
  onAccountDeleted,
}: SettingsPageProps) {
  const [form, setForm] = useState(buildForm(currentUser));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError('');
    setSuccess('');

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    if (file.size > 180000) {
      setError('Please choose an image smaller than 180 KB for now.');
      return;
    }

    try {
      const imageDataUrl = await readImageFile(file);
      setForm((currentForm) => ({
        ...currentForm,
        profileImageUrl: imageDataUrl,
      }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Failed to upload profile image.',
      );
    } finally {
      event.target.value = '';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    const payload: UpdateUserPayload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      farmerType: form.farmerType || undefined,
      password: form.password || undefined,
      profileImageUrl: form.profileImageUrl,
      preferredAreaUnit: form.preferredAreaUnit,
      preferredCurrency: form.preferredCurrency,
      preferredLanguage: form.preferredLanguage,
      dateFormat: form.dateFormat,
      emailNotifications: form.emailNotifications,
      smsNotifications: form.smsNotifications,
      weeklyReport: form.weeklyReport,
    };

    try {
      const updatedUser = await updateUser(currentUser.id, payload);
      onUserUpdated(updatedUser);
      setForm(buildForm(updatedUser));
      setSuccess('Settings saved.');
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to save settings.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      'Delete your account and all related farm records?',
    );

    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');
    setIsDeleting(true);

    try {
      await deleteUser(currentUser.id);
      onAccountDeleted();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete account.',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Account settings</h1>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}

      <form className="settings-layout" onSubmit={handleSubmit}>
        <section className="panel settings-profile-panel">
          <div className="settings-avatar-wrap">
            <img
              alt={`${currentUser.firstName} ${currentUser.lastName}`}
              className="settings-avatar"
              src={form.profileImageUrl}
            />
            <label className="settings-avatar-badge" aria-label="Upload custom profile image">
              <Camera size={16} />
              <input
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                type="file"
                onChange={(event) => void handleImageUpload(event)}
              />
            </label>
          </div>

          <div>
            <p className="eyebrow">Profile Photo</p>
            <h2>
              {currentUser.firstName} {currentUser.lastName}
            </h2>
            <p className="muted">
              Pick a ready-made profile image or press the camera to upload a small custom image.
            </p>
          </div>

          <div className="avatar-picker" aria-label="Default profile images">
            {DEFAULT_AVATAR_IMAGES.map((avatar) => (
              <button
                aria-label={`Use ${avatar.name} avatar`}
                className={
                  form.profileImageUrl === avatar.value
                    ? 'avatar-option active'
                    : 'avatar-option'
                }
                key={avatar.name}
                type="button"
                onClick={() =>
                  setForm({ ...form, profileImageUrl: avatar.value })
                }
              >
                <img alt="" src={avatar.value} />
              </button>
            ))}
          </div>

          <dl className="detail-list compact-detail-list">
            <div>
              <dt>Role</dt>
              <dd>{currentUser.role}</dd>
            </div>
            <div>
              <dt>Account Email</dt>
              <dd>{currentUser.email}</dd>
            </div>
          </dl>
        </section>

        <section className="panel form-grid settings-main-panel">
          <div className="settings-section-heading">
            <UserRound size={18} aria-hidden="true" />
            <div>
              <p className="eyebrow">Account</p>
              <h2>Personal information</h2>
            </div>
          </div>

          <div className="settings-two-column">
            <label>
              First Name
              <input
                required
                minLength={2}
                value={form.firstName}
                onChange={(event) =>
                  setForm({ ...form, firstName: event.target.value })
                }
              />
            </label>

            <label>
              Last Name
              <input
                required
                minLength={2}
                value={form.lastName}
                onChange={(event) =>
                  setForm({ ...form, lastName: event.target.value })
                }
              />
            </label>

            <label>
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </label>

            <label>
              Phone
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
              />
            </label>

            <label>
              Farmer Type
              <select
                value={form.farmerType}
                onChange={(event) =>
                  setForm({ ...form, farmerType: event.target.value })
                }
              >
                <option>Land Owner</option>
                <option>Thekka Farmer</option>
                <option>Batai Farmer</option>
                <option>Family Member</option>
                <option>Farm Manager</option>
              </select>
            </label>
          </div>

          <div className="settings-divider" />

          <div className="settings-section-heading">
            <Palette size={18} aria-hidden="true" />
            <div>
              <p className="eyebrow">Preferences</p>
              <h2>Workspace defaults</h2>
            </div>
          </div>

          <div className="settings-two-column">
            <label>
              Preferred Area Unit
              <select
                value={form.preferredAreaUnit}
                onChange={(event) =>
                  setForm({ ...form, preferredAreaUnit: event.target.value })
                }
              >
                <option>Acre</option>
                <option>Kanal</option>
                <option>Marla</option>
              </select>
            </label>

            <label>
              Currency
              <select
                value={form.preferredCurrency}
                onChange={(event) =>
                  setForm({ ...form, preferredCurrency: event.target.value })
                }
              >
                <option>PKR</option>
                <option>USD</option>
                <option>SAR</option>
                <option>AED</option>
              </select>
            </label>

            <label>
              Language
              <select
                value={form.preferredLanguage}
                onChange={(event) =>
                  setForm({ ...form, preferredLanguage: event.target.value })
                }
              >
                <option>English</option>
                <option>Urdu</option>
                <option>Punjabi</option>
              </select>
            </label>

            <label>
              Date Format
              <select
                value={form.dateFormat}
                onChange={(event) =>
                  setForm({ ...form, dateFormat: event.target.value })
                }
              >
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </label>
          </div>

          <div className="settings-divider" />

          <div className="settings-section-heading">
            <Bell size={18} aria-hidden="true" />
            <div>
              <p className="eyebrow">Notifications</p>
              <h2>Farm reminders</h2>
            </div>
          </div>

          <div className="settings-toggle-grid">
            <label className="settings-toggle-row">
              <span>
                <Mail size={16} aria-hidden="true" />
                Email Notifications
              </span>
              <input
                checked={form.emailNotifications}
                type="checkbox"
                onChange={(event) =>
                  setForm({
                    ...form,
                    emailNotifications: event.target.checked,
                  })
                }
              />
            </label>

            <label className="settings-toggle-row">
              <span>
                <Smartphone size={16} aria-hidden="true" />
                SMS Notifications
              </span>
              <input
                checked={form.smsNotifications}
                type="checkbox"
                onChange={(event) =>
                  setForm({
                    ...form,
                    smsNotifications: event.target.checked,
                  })
                }
              />
            </label>

            <label className="settings-toggle-row">
              <span>
                <Image size={16} aria-hidden="true" />
                Weekly Report
              </span>
              <input
                checked={form.weeklyReport}
                type="checkbox"
                onChange={(event) =>
                  setForm({ ...form, weeklyReport: event.target.checked })
                }
              />
            </label>
          </div>

          <div className="settings-divider" />

          <div className="settings-section-heading">
            <KeyRound size={18} aria-hidden="true" />
            <div>
              <p className="eyebrow">Security</p>
              <h2>Password</h2>
            </div>
          </div>

          <label>
            New Password
            <span className="password-field">
              <input
                minLength={8}
                type={isPasswordVisible ? 'text' : 'password'}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
              <button
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                className="password-toggle"
                type="button"
                onClick={() =>
                  setIsPasswordVisible((isVisible) => !isVisible)
                }
              >
                {isPasswordVisible ? (
                  <EyeOff size={17} aria-hidden="true" />
                ) : (
                  <Eye size={17} aria-hidden="true" />
                )}
              </button>
            </span>
          </label>

          <div className="settings-actions">
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </section>

        <section className="panel danger-zone-panel">
          <div className="settings-section-heading">
            <ShieldCheck size={18} aria-hidden="true" />
            <div>
              <p className="eyebrow">Account Safety</p>
              <h2>Danger zone</h2>
            </div>
          </div>
          <p className="muted">
            Deleting your account also removes your profiles, zameen, crops,
            expenses, income, and reports.
          </p>
          <button
            className="danger-button"
            disabled={isDeleting}
            type="button"
            onClick={handleDelete}
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </section>
      </form>
    </>
  );
}
