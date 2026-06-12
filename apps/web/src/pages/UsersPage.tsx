import { type FormEvent, useState } from 'react';
import {
  deleteUser,
  updateUser,
  type UpdateUserPayload,
  type User,
} from '../lib/api';

type UsersPageProps = {
  currentUser: User;
  onUserUpdated: (user: User) => void;
  onAccountDeleted: () => void;
};

function buildForm(user: User) {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? '',
    password: '',
    farmerType: user.farmerType ?? 'Land owner',
  };
}

export function UsersPage({
  currentUser,
  onUserUpdated,
  onAccountDeleted,
}: UsersPageProps) {
  const [form, setForm] = useState(buildForm(currentUser));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    };

    try {
      const updatedUser = await updateUser(currentUser.id, payload);
      onUserUpdated(updatedUser);
      setForm(buildForm(updatedUser));
      setSuccess('Account updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update account.');
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
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete account.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Farmer account</h1>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}

      <section className="content-grid">
        <form className="panel form-grid" onSubmit={handleSubmit}>
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
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>

          <label>
            Phone
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>

          <label>
            New Password
            <input
              minLength={8}
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
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
              <option>Land owner</option>
              <option>Thekka farmer</option>
              <option>Batai farmer</option>
              <option>Family member</option>
              <option>Farm manager</option>
            </select>
          </label>

          <button className="primary-button" disabled={isSaving} type="submit">
            {isSaving ? 'Saving...' : 'Update Account'}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Signed In</p>
              <h2>
                {currentUser.firstName} {currentUser.lastName}
              </h2>
            </div>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Email</dt>
              <dd>{currentUser.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{currentUser.phone ?? '-'}</dd>
            </div>
            <div>
              <dt>Farmer Type</dt>
              <dd>{currentUser.farmerType ?? '-'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{currentUser.role}</dd>
            </div>
          </dl>

          <button
            className="danger-button"
            disabled={isDeleting}
            type="button"
            onClick={handleDelete}
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </section>
      </section>
    </>
  );
}
