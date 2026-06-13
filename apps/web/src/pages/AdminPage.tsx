import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  MailWarning,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { FieldLabel } from '../components/FieldLabel';
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

  return new Date(dateValue).toLocaleDateString('en-GB');
}

export function AdminPage({ currentUser, onNotify }: AdminPageProps) {
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
          setError(loadError instanceof Error ? loadError.message : 'Failed to load users.');
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
  }, []);

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
      onNotify('User account created successfully');
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to create user.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteUser(user: User) {
    if (user.id === currentUser.id) {
      setError('Use account settings if you need to delete your own account.');
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
      onNotify('Record deleted successfully');
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Failed to delete user.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (currentUser.role !== 'ADMIN') {
    return (
      <section className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Restricted area</h1>
        </div>
        <p className="muted">Only authorized admins can open this section.</p>
      </section>
    );
  }

  return (
    <section className="page-stack admin-screen">
      <section className="page-header admin-hero-panel">
        <div>
          <p className="eyebrow">Full authorization</p>
          <h1>Admin panel</h1>
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
          <span>Total users</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="metric-card">
          <ShieldCheck size={20} aria-hidden="true" />
          <span>Admins</span>
          <strong>{stats.admins}</strong>
        </article>
        <article className="metric-card">
          <UserCog size={20} aria-hidden="true" />
          <span>Farmers</span>
          <strong>{stats.farmers}</strong>
        </article>
        <article className="metric-card">
          <BadgeCheck size={20} aria-hidden="true" />
          <span>Verified</span>
          <strong>{stats.verified}</strong>
        </article>
      </section>

      <section className="panel feature-notice-panel">
        <MailWarning size={20} aria-hidden="true" />
        <div>
          <strong>Email and Google sign-in status</strong>
          <p>
            SMTP delivery, real password-reset emails, and production Google OAuth
            remain disabled until those services are configured.
          </p>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel form-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Admin action</p>
            <h2>Create user account</h2>
          </div>
          <UserPlus size={22} aria-hidden="true" />
        </div>

        <form className="form-grid two-column-form" onSubmit={handleSubmit}>
          <label>
            <FieldLabel required>First name</FieldLabel>
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
            <FieldLabel required>Last name</FieldLabel>
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
            <FieldLabel required>Email</FieldLabel>
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
            <FieldLabel required>Password</FieldLabel>
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
            <FieldLabel>Phone</FieldLabel>
            <input
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
          </label>
          <label>
            <FieldLabel>Farmer type</FieldLabel>
            <select
              value={form.farmerType}
              onChange={(event) =>
                setForm({ ...form, farmerType: event.target.value })
              }
            >
              <option value="Land Owner">Land owner</option>
              <option value="Thekka Farmer">Thekka farmer</option>
              <option value="Batai Farmer">Batai farmer</option>
              <option value="Family Member">Family member</option>
              <option value="Farm Manager">Farm manager</option>
            </select>
          </label>
          <label>
            <FieldLabel required>Role</FieldLabel>
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
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <button className="primary-button" disabled={isSaving} type="submit">
            {isSaving ? 'Creating...' : 'Create user'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Users</p>
            <h2>Account access</h2>
          </div>
          <span className="record-count">
            {isLoading ? 'Loading...' : `${users.length} total`}
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Action</th>
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
