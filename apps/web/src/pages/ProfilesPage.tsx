import { type FormEvent, useEffect, useState } from 'react';
import {
  createProfile,
  deleteProfile,
  getProfiles,
  updateProfile,
  type Profile,
} from '../lib/api';

const initialForm = {
  profileName: '',
  city: '',
  chakAreaName: '',
  villageName: '',
};

export function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  async function loadData() {
    const profilesData = await getProfiles();
    setProfiles(profilesData);
  }

  useEffect(() => {
    let isActive = true;

    getProfiles()
      .then((profilesData) => {
        if (!isActive) {
          return;
        }

        setProfiles(profilesData);
      })
      .catch((loadError) => {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load profiles.');
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
      const payload = {
        profileName: form.profileName,
        city: form.city || undefined,
        chakAreaName: form.chakAreaName || undefined,
        villageName: form.villageName || undefined,
      };

      if (editingProfileId) {
        await updateProfile(editingProfileId, payload);
      } else {
        await createProfile(payload);
      }

      setForm(initialForm);
      setEditingProfileId(null);
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to save profile.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(profile: Profile) {
    setEditingProfileId(profile.id);
    setForm({
      profileName: profile.profileName,
      city: profile.city ?? '',
      chakAreaName: profile.chakAreaName ?? '',
      villageName: profile.villageName ?? '',
    });
  }

  function cancelEdit() {
    setEditingProfileId(null);
    setForm(initialForm);
  }

  async function handleDelete(profile: Profile) {
    const confirmed = window.confirm(`Delete profile "${profile.profileName}"?`);

    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await deleteProfile(profile.id);
      if (editingProfileId === profile.id) {
        cancelEdit();
      }
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete profile.',
      );
    }
  }

  const sortedProfiles = [...profiles].sort(
    (firstProfile, secondProfile) =>
      new Date(firstProfile.createdAt).getTime() -
      new Date(secondProfile.createdAt).getTime(),
  );

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">Profiles</p>
          <h1>Kheti profiles</h1>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="content-grid">
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>{editingProfileId ? 'Edit Profile' : 'Create Profile'}</h2>
            {editingProfileId ? (
              <button className="text-button" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>

          <label>
            Profile Name
            <input
              required
              minLength={2}
              value={form.profileName}
              onChange={(event) => setForm({ ...form, profileName: event.target.value })}
            />
          </label>

          <label>
            City
            <input
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
            />
          </label>

          <label>
            Area
            <input
              value={form.chakAreaName}
              onChange={(event) => setForm({ ...form, chakAreaName: event.target.value })}
            />
          </label>

          <label>
            Village
            <input
              value={form.villageName}
              onChange={(event) => setForm({ ...form, villageName: event.target.value })}
            />
          </label>

          <button className="primary-button" disabled={isSaving} type="submit">
            {isSaving
              ? 'Saving...'
              : editingProfileId
                ? 'Update Profile'
                : 'Create Profile'}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Profiles</p>
              <h2>{profiles.length} total</h2>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Profile</th>
                  <th>City</th>
                  <th>Area</th>
                  <th>Village</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6}>Loading profiles...</td>
                  </tr>
                ) : sortedProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No profiles yet.</td>
                  </tr>
                ) : (
                  sortedProfiles.map((profile, index) => (
                    <tr key={profile.id}>
                      <td>Profile {index + 1}</td>
                      <td>{profile.profileName}</td>
                      <td>{profile.city ?? '-'}</td>
                      <td>{profile.chakAreaName ?? '-'}</td>
                      <td>{profile.villageName ?? '-'}</td>
                      <td>
                        <div className="action-row">
                          <button type="button" onClick={() => startEdit(profile)}>
                            Edit
                          </button>
                          <button
                            className="danger-text-button"
                            type="button"
                            onClick={() => void handleDelete(profile)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </>
  );
}
