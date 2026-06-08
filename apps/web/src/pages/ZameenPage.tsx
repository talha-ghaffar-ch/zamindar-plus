import { type FormEvent, useEffect, useState } from 'react';
import { AREA_UNITS, toSquareFeet, type AreaUnit } from '@zamindar/shared';

import {
  createZameen,
  deleteZameen,
  getProfiles,
  getZameen,
  updateZameen,
  type Profile,
  type Zameen,
} from '../lib/api';

const initialForm = {
  profileId: '',
  murabbaNumber: '',
  zameenName: '',
  killaNumber: '',
  khasraNumber: '',
  totalAreaValue: '',
  totalAreaUnit: 'Acre',
  ownershipType: 'Own land',
  notes: '',
};

export function ZameenPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [zameen, setZameen] = useState<Zameen[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingZameenId, setEditingZameenId] = useState<string | null>(null);
  const [profileFilter, setProfileFilter] = useState('all');

  async function loadData() {
    const [profilesData, zameenData] = await Promise.all([getProfiles(), getZameen()]);
    setProfiles(profilesData);
    setZameen(zameenData);

    if (!form.profileId && profilesData.length > 0) {
      setForm((currentForm) => ({
        ...currentForm,
        profileId: profilesData[0].id,
      }));
    }
  }

  useEffect(() => {
    let isActive = true;

    Promise.all([getProfiles(), getZameen()])
      .then(([profilesData, zameenData]) => {
        if (!isActive) return;

        setProfiles(profilesData);
        setZameen(zameenData);

        if (profilesData.length > 0) {
          setForm((currentForm) =>
            currentForm.profileId
              ? currentForm
              : { ...currentForm, profileId: profilesData[0].id },
          );
        }
      })
      .catch((loadError) => {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load zameen.');
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

    const areaValue = Number(form.totalAreaValue);
    const totalAreaSqft = toSquareFeet(areaValue, form.totalAreaUnit as AreaUnit);

    try {
      const payload = {
        profileId: form.profileId,
        murabbaNumber: form.murabbaNumber || undefined,
        zameenName: form.zameenName,
        killaNumber: form.killaNumber || undefined,
        khasraNumber: form.khasraNumber || undefined,
        totalAreaValue: areaValue,
        totalAreaUnit: form.totalAreaUnit,
        totalAreaSqft,
        ownershipType: form.ownershipType || undefined,
        notes: form.notes || undefined,
      };

      if (editingZameenId) {
        await updateZameen(editingZameenId, payload);
      } else {
        await createZameen(payload);
      }

      setForm({
        ...initialForm,
        profileId: form.profileId,
      });
      setEditingZameenId(null);
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to save zameen.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(item: Zameen) {
    setEditingZameenId(item.id);
    setForm({
      profileId: item.profileId,
      murabbaNumber: item.murabbaNumber ?? '',
      zameenName: item.zameenName,
      killaNumber: item.killaNumber ?? '',
      khasraNumber: item.khasraNumber ?? '',
      totalAreaValue: String(item.totalAreaValue),
      totalAreaUnit: item.totalAreaUnit,
      ownershipType: item.ownershipType ?? 'Own land',
      notes: item.notes ?? '',
    });
  }

  function cancelEdit() {
    setEditingZameenId(null);
    setForm({
      ...initialForm,
      profileId: profiles[0]?.id ?? '',
    });
  }

  async function handleDelete(item: Zameen) {
    const confirmed = window.confirm(`Delete zameen "${item.zameenName}"?`);

    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await deleteZameen(item.id);
      if (editingZameenId === item.id) {
        cancelEdit();
      }
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete zameen.',
      );
    }
  }

  function profileName(profileId: string) {
    return profiles.find((profile) => profile.id === profileId)?.profileName ?? profileId;
  }

  const filteredZameen =
    profileFilter === 'all'
      ? zameen
      : zameen.filter((item) => item.profileId === profileFilter);

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">Zameen</p>
          <h1>Zameen records</h1>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="content-grid">
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>{editingZameenId ? 'Edit Zameen' : 'Create Zameen'}</h2>
            {editingZameenId ? (
              <button className="text-button" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>

          <label>
            Profile
            <select
              required
              value={form.profileId}
              onChange={(event) => setForm({ ...form, profileId: event.target.value })}
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.profileName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Zameen Name
            <input
              required
              minLength={2}
              value={form.zameenName}
              onChange={(event) => setForm({ ...form, zameenName: event.target.value })}
            />
          </label>

          <label>
            Murabba Number
            <input
              value={form.murabbaNumber}
              onChange={(event) => setForm({ ...form, murabbaNumber: event.target.value })}
            />
          </label>

          <label>
            Total Area
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              value={form.totalAreaValue}
              onChange={(event) => setForm({ ...form, totalAreaValue: event.target.value })}
            />
          </label>

          <label>
            Area Unit
            <select
              value={form.totalAreaUnit}
              onChange={(event) => setForm({ ...form, totalAreaUnit: event.target.value })}
            >
              {AREA_UNITS.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          </label>

          <label>
            Ownership Type
            <select
              value={form.ownershipType}
              onChange={(event) => setForm({ ...form, ownershipType: event.target.value })}
            >
              <option>Own land</option>
              <option>Thekka land</option>
              <option>Batai land</option>
              <option>Family land</option>
              <option>Managed land</option>
            </select>
          </label>

          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>

          <button className="primary-button" disabled={isSaving || profiles.length === 0} type="submit">
            {isSaving
              ? 'Saving...'
              : editingZameenId
                ? 'Update Zameen'
                : 'Create Zameen'}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Zameen</p>
              <h2>{filteredZameen.length} total</h2>
            </div>
            <select
              className="inline-filter"
              value={profileFilter}
              onChange={(event) => setProfileFilter(event.target.value)}
            >
              <option value="all">All profiles</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.profileName}
                </option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Profile</th>
                  <th>Murabba</th>
                  <th>Area</th>
                  <th>Ownership</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredZameen.map((item) => (
                  <tr key={item.id}>
                    <td>{item.zameenName}</td>
                    <td>{profileName(item.profileId)}</td>
                    <td>{item.murabbaNumber ?? '-'}</td>
                    <td>
                      {item.totalAreaValue} {item.totalAreaUnit}
                    </td>
                    <td>{item.ownershipType ?? '-'}</td>
                    <td>
                      <div className="action-row">
                        <button type="button" onClick={() => startEdit(item)}>
                          Edit
                        </button>
                        <button
                          className="danger-text-button"
                          type="button"
                          onClick={() => void handleDelete(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
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
