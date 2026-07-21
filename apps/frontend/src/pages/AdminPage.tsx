import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { FieldLabel } from '../components/FieldLabel';
import { useI18n } from '../i18n/useT';
import {
  createUser,
  deleteUser,
  getUsers,
  type CreateUserPayload,
  type User,
} from '../lib/api';

type AdminPageProps = {
  currentUser: User;
  onNotify: (message: string) => void;
};

const initialAdminUserForm: CreateUserPayload = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  farmerType: 'Land Owner',
  role: 'USER',
};

function fullName(user: User) {
  return `${user.firstName} ${user.lastName}`.trim();
}

function formatDate(dateValue: string | null) {
  if (!dateValue) {
    return 'Not verified';
  }

  const date = new Date(dateValue);

  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
}

export function AdminPage({ currentUser, onNotify }: AdminPageProps) {
  const { t } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(initialAdminUserForm);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const stats = useMemo(() => {
    const admins = users.filter((user) => user.role === 'ADMIN').length;
    const verified = users.filter((user) => user.emailVerified).length;

    return {
      total: users.length,
      admins,
      farmers: users.length - admins,
      verified,
    };
  }, [users]);

  async function loadUsers() {
    const usersData = await getUsers();
    setUsers(usersData);
  }

  useEffect(() => {
    let isActive = true;

    getUsers()
      .then((usersData) => {
        if (isActive) {
          setUsers(usersData);
        }
      })
      .catch((loadError) => {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : t('admin.loadFailed'));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      await createUser({
        ...form,
        email: form.email.trim(),
        phone: form.phone || undefined,
        farmerType: form.farmerType || undefined,
        role: form.role,
      });
      setForm(initialAdminUserForm);
      await loadUsers();
      onNotify(t('admin.userCreated'));
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t('admin.createFailed'),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteUser(user: User) {
    if (user.id === currentUser.id) {
      setError(t('admin.deleteOwnAccount'));
      return;
    }

    const confirmed = window.confirm(`Delete ${fullName(user)}?`);

    if (!confirmed) {
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      await deleteUser(user.id);
      await loadUsers();
      onNotify(t('records.deleted'));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : t('admin.deleteFailed'),
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (currentUser.role !== 'ADMIN') {
    return (
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('admin.roleAdmin')}</p>
          <h1>{t('admin.restricted')}</h1>
        </div>
        <p className="muted">{t('admin.restrictedNote')}</p>
      </section>
    );
  }

  return (
    <section className="page-stack admin-screen">
      <section className="page-header admin-hero-panel">
        <div>
          <p className="eyebrow">{t('admin.fullAuth')}</p>
          <h1>{t('admin.panel')}</h1>
          <p className="muted">
            Core admin access for user visibility, account creation, and user
            control across Zamindar Plus.
          </p>
        </div>
        <div className="admin-authority-badge">
          <ShieldCheck size={22} aria-hidden="true" />
          <span>{currentUser.email}</span>
        </div>
      </section>

      <section className="admin-stat-grid">
        <article className="metric-card">
          <UsersRound size={20} aria-hidden="true" />
          <span>{t('admin.totalUsers')}</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="metric-card">
          <ShieldCheck size={20} aria-hidden="true" />
          <span>{t('admin.admins')}</span>
          <strong>{stats.admins}</strong>
        </article>
        <article className="metric-card">
          <UserCog size={20} aria-hidden="true" />
          <span>{t('admin.farmers')}</span>
          <strong>{stats.farmers}</strong>
        </article>
        <article className="metric-card">
          <BadgeCheck size={20} aria-hidden="true" />
          <span>{t('admin.verified')}</span>
          <strong>{stats.verified}</strong>
        </article>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel form-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('admin.adminAction')}</p>
            <h2>{t('admin.createUser')}</h2>
          </div>
          <UserPlus size={22} aria-hidden="true" />
        </div>

        <form className="form-grid two-column-form" onSubmit={handleSubmit}>
          <label>
            <FieldLabel required>{t('admin.firstName')}</FieldLabel>
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
            <FieldLabel required>{t('admin.lastName')}</FieldLabel>
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
            <FieldLabel required>{t('admin.email')}</FieldLabel>
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
            <FieldLabel required>{t('admin.password')}</FieldLabel>
            <input
              required
              minLength={8}
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
          </label>
          <label>
            <FieldLabel>{t('admin.phone')}</FieldLabel>
            <input
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
          </label>
          <label>
            <FieldLabel>{t('admin.farmerType')}</FieldLabel>
            <select
              value={form.farmerType}
              onChange={(event) =>
                setForm({ ...form, farmerType: event.target.value })
              }
            >
              <option value="Land Owner">{t('auth.typeLandOwner')}</option>
              <option value="Thekka Farmer">{t('auth.typeThekka')}</option>
              <option value="Batai Farmer">{t('auth.typeBatai')}</option>
              <option value="Family Member">{t('auth.typeFamily')}</option>
              <option value="Farm Manager">{t('auth.typeManager')}</option>
            </select>
          </label>
          <label>
            <FieldLabel required>{t('admin.roleLabel')}</FieldLabel>
            <select
              required
              value={form.role}
              onChange={(event) =>
                setForm({
                  ...form,
                  role: event.target.value as 'ADMIN' | 'USER',
                })
              }
            >
              <option value="USER">{t('admin.roleUser')}</option>
              <option value="ADMIN">{t('admin.roleAdmin')}</option>
            </select>
          </label>

          <button className="primary-button" disabled={isSaving} type="submit">
            {isSaving ? t('admin.creating') : t('admin.createButton')}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('admin.users')}</p>
            <h2>{t('admin.accountAccess')}</h2>
          </div>
          <span className="record-count">
            {isLoading ? 'Loading...' : `${users.length} total`}
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('admin.colName')}</th>
                <th>{t('admin.colEmail')}</th>
                <th>{t('admin.colRole')}</th>
                <th>{t('admin.colStatus')}</th>
                <th>{t('admin.colVerified')}</th>
                <th>{t('admin.colAction')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{fullName(user)}</td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className={
                        user.role === 'ADMIN'
                          ? 'status-pill status-paid'
                          : 'status-pill'
                      }
                    >
                      {user.role === 'ADMIN' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        user.emailVerified
                          ? 'status-pill status-paid'
                          : 'status-pill status-unpaid'
                      }
                    >
                      {user.emailVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td>{formatDate(user.emailVerifiedAt)}</td>
                  <td>
                    <button
                      className="danger-text-button"
                      disabled={isSaving || user.id === currentUser.id}
                      type="button"
                      onClick={() => void handleDeleteUser(user)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
