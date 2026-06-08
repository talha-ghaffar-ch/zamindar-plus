import { type FormEvent, useEffect, useState } from 'react';
import { createProfile, getProfiles, type Profile } from '../lib/api';

const initialForm = {
  profileName: '',
  city: '',
  chakAreaName: '',
  villageName: '',
  notes: '',
};

export function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      await createProfile({
        profileName: form.profileName,
        city: form.city || undefined,
        chakAreaName: form.chakAreaName || undefined,
        villageName: form.villageName || undefined,
        notes: form.notes || undefined,
      });

      setForm(initialForm);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create profile.');
    } finally {
      setIsSaving(false);
    }
  }

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
            Chak / Area Name
            <input
              value={form.chakAreaName}
              onChange={(event) => setForm({ ...form, chakAreaName: event.target.value })}
            />
          </label>

          <label>
            Village Name
            <input
              value={form.villageName}
              onChange={(event) => setForm({ ...form, villageName: event.target.value })}
            />
          </label>

          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>

          <button className="primary-button" disabled={isSaving} type="submit">
            {isSaving ? 'Saving...' : 'Create Profile'}
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
                  <th>Profile</th>
                  <th>City</th>
                  <th>Chak / Area</th>
                  <th>Village</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td>{profile.profileName}</td>
                    <td>{profile.city ?? '-'}</td>
                    <td>{profile.chakAreaName ?? '-'}</td>
                    <td>{profile.villageName ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </>
  );
}
