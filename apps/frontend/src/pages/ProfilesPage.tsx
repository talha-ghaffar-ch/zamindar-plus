import { type FormEvent, useEffect, useState } from 'react';
import {
  createProfile,
  deleteProfile,
  getProfiles,
  updateProfile,
  type Profile,
} from '../lib/api';
import { FieldLabel } from '../components/FieldLabel';
import { useI18n } from '../i18n/useT';

type ProfilesPageProps = {
  onNotify: (message: string) => void;
};

const initialForm = {
  profileName: '',
  city: '',
  chakAreaName: '',
  villageName: '',
};

export function ProfilesPage({ onNotify }: ProfilesPageProps) {
  const { t } = useI18n();
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
          setError(
            loadError instanceof Error
              ? loadError.message
              : t('profiles.loadFailed'),
          );
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
      const payload = {
        profileName: form.profileName,
        city: form.city || undefined,
        chakAreaName: form.chakAreaName || undefined,
        villageName: form.villageName || undefined,
      };

      if (editingProfileId) {
        await updateProfile(editingProfileId, payload);
        onNotify(t('records.updated'));
      } else {
        await createProfile(payload);
        onNotify(t('profiles.created'));
      }

      setForm(initialForm);
      setEditingProfileId(null);
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t('profiles.saveFailed'),
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
    const confirmed = window.confirm(
      t('profiles.confirmDelete', { name: profile.profileName }),
    );

    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await deleteProfile(profile.id);
      onNotify(t('records.deleted'));
      if (editingProfileId === profile.id) {
        cancelEdit();
      }
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : t('profiles.deleteFailed'),
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
          <p className="eyebrow">{t('profiles.eyebrow')}</p>
          <h1>{t('profiles.title')}</h1>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="content-grid">
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>
              {editingProfileId
                ? t('profiles.editTitle')
                : t('profiles.createTitle')}
            </h2>
            {editingProfileId ? (
              <button className="text-button" type="button" onClick={cancelEdit}>
                {t('common.cancel')}
              </button>
            ) : null}
          </div>

          <label>
            <FieldLabel required>{t('profiles.name')}</FieldLabel>
            <input
              required
              minLength={2}
              value={form.profileName}
              onChange={(event) => setForm({ ...form, profileName: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel>{t('profiles.city')}</FieldLabel>
            <input
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel>{t('profiles.area')}</FieldLabel>
            <input
              value={form.chakAreaName}
              onChange={(event) => setForm({ ...form, chakAreaName: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel>{t('profiles.village')}</FieldLabel>
            <input
              value={form.villageName}
              onChange={(event) => setForm({ ...form, villageName: event.target.value })}
            />
          </label>

          <button className="primary-button" disabled={isSaving} type="submit">
            {isSaving
              ? t('common.saving')
              : editingProfileId
                ? t('profiles.updateButton')
                : t('profiles.createButton')}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t('profiles.eyebrow')}</p>
              <h2>
                {profiles.length} {t('records.total')}
              </h2>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('records.number')}</th>
                  <th>{t('profiles.columnProfile')}</th>
                  <th>{t('profiles.city')}</th>
                  <th>{t('profiles.area')}</th>
                  <th>{t('profiles.village')}</th>
                  <th>{t('records.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6}>{t('profiles.loading')}</td>
                  </tr>
                ) : sortedProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={6}>{t('profiles.empty')}</td>
                  </tr>
                ) : (
                  sortedProfiles.map((profile, index) => (
                    <tr key={profile.id}>
                      <td>
                        <strong className="record-number">{index + 1}</strong>
                      </td>
                      <td>{profile.profileName}</td>
                      <td>{profile.city ?? '-'}</td>
                      <td>{profile.chakAreaName ?? '-'}</td>
                      <td>{profile.villageName ?? '-'}</td>
                      <td>
                        <div className="action-row">
                          <button type="button" onClick={() => startEdit(profile)}>
                            {t('common.edit')}
                          </button>
                          <button
                            className="danger-text-button"
                            type="button"
                            onClick={() => void handleDelete(profile)}
                          >
                            {t('common.delete')}
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
