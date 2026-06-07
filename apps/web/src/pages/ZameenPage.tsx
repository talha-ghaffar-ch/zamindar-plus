import { type FormEvent, useEffect, useState } from 'react';
import {
  createZameen,
  getProfiles,
  getZameen,
  type Profile,
  type Zameen,
} from '../lib/api';

const areaUnits = ['Acre', 'Killa', 'Murabba', 'Kanal', 'Marla', 'Square feet'];

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

function toSquareFeet(value: number, unit: string) {
  const multipliers: Record<string, number> = {
    Acre: 43560,
    Killa: 43560,
    Murabba: 1089000,
    Kanal: 5445,
    Marla: 272.25,
    'Square feet': 1,
  };

  return value * (multipliers[unit] ?? 1);
}

export function ZameenPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [zameen, setZameen] = useState<Zameen[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
    const totalAreaSqft = toSquareFeet(areaValue, form.totalAreaUnit);

    try {
      await createZameen({
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
      });

      setForm({
        ...initialForm,
        profileId: form.profileId,
      });
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create zameen.');
    } finally {
      setIsSaving(false);
    }
  }

  function profileName(profileId: string) {
    return profiles.find((profile) => profile.id === profileId)?.profileName ?? profileId;
  }

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
              {areaUnits.map((unit) => (
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
            {isSaving ? 'Saving...' : 'Create Zameen'}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Zameen</p>
              <h2>{zameen.length} total</h2>
            </div>
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
                </tr>
              </thead>
              <tbody>
                {zameen.map((item) => (
                  <tr key={item.id}>
                    <td>{item.zameenName}</td>
                    <td>{profileName(item.profileId)}</td>
                    <td>{item.murabbaNumber ?? '-'}</td>
                    <td>
                      {item.totalAreaValue} {item.totalAreaUnit}
                    </td>
                    <td>{item.ownershipType ?? '-'}</td>
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