import { type FormEvent, useEffect, useState } from 'react';
import {
  AREA_UNITS,
  areaUnitKey,
  ownershipTypeKey,
  toSquareFeet,
  type AreaUnit,
} from '@zamindar/shared';

import {
  createZameen,
  deleteZameen,
  getProfiles,
  getZameen,
  updateZameen,
  type Profile,
  type Zameen,
} from '../lib/api';
import { FieldLabel } from '../components/FieldLabel';
import { groupByParent } from '../lib/recordGrouping';
import { useI18n } from '../i18n/useT';

type ZameenPageProps = {
  onNotify: (message: string) => void;
};

const initialForm = {
  profileId: '',
  murabbaNumber: '',
  zameenName: '',
  killaNumber: '',
  khasraNumber: '',
  totalAreaValue: '',
  totalAreaUnit: 'Acre',
  ownershipType: 'Own Land',
};

export function ZameenPage({ onNotify }: ZameenPageProps) {
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [zameen, setZameen] = useState<Zameen[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
          setError(loadError instanceof Error ? loadError.message : t('zameen.loadFailed'));
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
      };

      if (editingZameenId) {
        await updateZameen(editingZameenId, payload);
        onNotify(t('records.updated'));
      } else {
        await createZameen(payload);
        onNotify(t('zameen.created'));
      }

      setForm({
        ...initialForm,
        profileId: form.profileId,
      });
      setEditingZameenId(null);
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t('zameen.saveFailed'),
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
      ownershipType: item.ownershipType ?? 'Own Land',
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
    const confirmed = window.confirm(t('zameen.confirmDelete', { name: item.zameenName }));

    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await deleteZameen(item.id);
      onNotify(t('records.deleted'));
      if (editingZameenId === item.id) {
        cancelEdit();
      }
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : t('zameen.deleteFailed'),
      );
    }
  }

  const sortedProfiles = [...profiles].sort((firstProfile, secondProfile) =>
    firstProfile.profileName.localeCompare(secondProfile.profileName),
  );
  const visibleProfiles =
    profileFilter === 'all'
      ? sortedProfiles
      : sortedProfiles.filter((profile) => profile.id === profileFilter);
  const visibleZameen =
    profileFilter === 'all'
      ? zameen
      : zameen.filter((item) => item.profileId === profileFilter);
  const groupedZameen = groupByParent(
    visibleProfiles,
    visibleZameen,
    (profile) => profile.id,
    (profile, index) => `${index + 1}: ${profile.profileName}`,
    (item) => item.profileId,
  );

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('zameen.eyebrow')}</p>
          <h1>{t('zameen.title')}</h1>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="content-grid">
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>{editingZameenId ? t('zameen.editTitle') : t('zameen.createTitle')}</h2>
            {editingZameenId ? (
              <button className="text-button" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>

          <label>
            <FieldLabel required>{t('zameen.profile')}</FieldLabel>
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
            <FieldLabel required>{t('zameen.name')}</FieldLabel>
            <input
              required
              minLength={2}
              value={form.zameenName}
              onChange={(event) => setForm({ ...form, zameenName: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel>{t('zameen.murabba')}</FieldLabel>
            <input
              value={form.murabbaNumber}
              onChange={(event) => setForm({ ...form, murabbaNumber: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel>{t('zameen.killa')}</FieldLabel>
            <input
              value={form.killaNumber}
              onChange={(event) => setForm({ ...form, killaNumber: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel>{t('zameen.khasra')}</FieldLabel>
            <input
              value={form.khasraNumber}
              onChange={(event) => setForm({ ...form, khasraNumber: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel required>{t('zameen.totalArea')}</FieldLabel>
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
            <FieldLabel required>{t('zameen.areaUnit')}</FieldLabel>
            <select
              value={form.totalAreaUnit}
              onChange={(event) => setForm({ ...form, totalAreaUnit: event.target.value })}
            >
              {AREA_UNITS.map((unit) => {
                const unitKey = areaUnitKey(unit);
                return (
                  <option key={unit} value={unit}>
                    {unitKey ? t(unitKey) : unit}
                  </option>
                );
              })}
            </select>
          </label>

          <label>
            <FieldLabel>{t('zameen.ownershipType')}</FieldLabel>
            <select
              value={form.ownershipType}
              onChange={(event) => setForm({ ...form, ownershipType: event.target.value })}
            >
              <option value="Own Land">{t('units.ownershipOwn')}</option>
              <option value="Thekka Land">{t('units.ownershipThekka')}</option>
              <option value="Batai Land">{t('units.ownershipBatai')}</option>
              <option value="Family Land">{t('units.ownershipFamily')}</option>
              <option value="Managed Land">{t('units.ownershipManaged')}</option>
            </select>
          </label>

          <button className="primary-button" disabled={isSaving || profiles.length === 0} type="submit">
            {isSaving
              ? t('common.saving')
              : editingZameenId
                ? t('zameen.updateButton')
                : t('zameen.createButton')}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t('zameen.eyebrow')}</p>
              <h2>
                {visibleZameen.length} {t('records.total')}
              </h2>
            </div>
            <select
              className="inline-filter"
              value={profileFilter}
              onChange={(event) => setProfileFilter(event.target.value)}
            >
              <option value="all">{t('zameen.allProfiles')}</option>
              {sortedProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.profileName}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <p className="muted">{t('zameen.loading')}</p>
          ) : groupedZameen.length === 0 ? (
            <p className="muted">{t('zameen.empty')}</p>
          ) : (
            <div className="grouped-records">
              {groupedZameen.map((group) => (
                <article className="record-group" key={group.key}>
                  <div className="record-group-header">
                    <h3>{group.label}</h3>
                    <span>{group.items.length} Zameen</span>
                  </div>

                  <div className="record-list">
                    {group.items
                      .sort((firstItem, secondItem) =>
                        firstItem.zameenName.localeCompare(secondItem.zameenName),
                      )
                      .map((item) => (
                        <article className="record-card" key={item.id}>
                          <div>
                            <p className="eyebrow">{ownershipTypeKey(item.ownershipType)
                                ? t(ownershipTypeKey(item.ownershipType)!)
                                : t('zameen.ownershipNotSet')}</p>
                            <h4>{item.zameenName}</h4>
                          </div>
                          <dl className="record-meta">
                            <div>
                              <dt>{t('zameen.colArea')}</dt>
                              <dd>
                                {item.totalAreaValue}{' '}
                                {areaUnitKey(item.totalAreaUnit)
                                  ? t(areaUnitKey(item.totalAreaUnit)!)
                                  : item.totalAreaUnit}
                              </dd>
                            </div>
                            <div>
                              <dt>{t('zameen.colMurabba')}</dt>
                              <dd>{item.murabbaNumber ?? '-'}</dd>
                            </div>
                            <div>
                              <dt>{t('zameen.colKilla')}</dt>
                              <dd>{item.killaNumber ?? '-'}</dd>
                            </div>
                            <div>
                              <dt>{t('zameen.colKhasra')}</dt>
                              <dd>{item.khasraNumber ?? '-'}</dd>
                            </div>
                          </dl>
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
                        </article>
                      ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </>
  );
}
