import { type FormEvent, useEffect, useState } from 'react';
import { AREA_UNITS, toSquareFeet, type AreaUnit } from '@zamindar/shared';

import {
  createCrop,
  deleteCrop,
  getCrops,
  getZameen,
  updateCrop,
  type Crop,
  type Zameen,
} from '../lib/api';
import { FieldLabel } from '../components/FieldLabel';
import { groupByParent } from '../lib/recordGrouping';

type CropsPageProps = {
  onNotify: (message: string) => void;
};

const cropNames = ['Wheat', 'Rice', 'Sugarcane', 'Cotton', 'Maize', 'Fodder'];
const cropStatuses = ['Active', 'Completed'];

const initialForm = {
  zameenId: '',
  cropName: 'Wheat',
  cropAreaValue: '',
  cropAreaUnit: 'Acre',
  startPeriod: '2026-01',
  status: 'Active',
};

function cropStartPeriod(crop: Crop) {
  if (!crop.startYear || !crop.startMonth) {
    return '';
  }

  return `${crop.startYear}-${String(crop.startMonth).padStart(2, '0')}`;
}

function startPeriodLabel(crop: Crop) {
  if (!crop.startYear || !crop.startMonth) {
    return '-';
  }

  return new Date(crop.startYear, crop.startMonth - 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

function splitStartPeriod(startPeriod: string) {
  const [yearValue, monthValue] = startPeriod.split('-').map(Number);

  return {
    startMonth: monthValue || undefined,
    startYear: yearValue || undefined,
  };
}

export function CropsPage({ onNotify }: CropsPageProps) {
  const [zameen, setZameen] = useState<Zameen[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCropId, setEditingCropId] = useState<string | null>(null);
  const [zameenFilter, setZameenFilter] = useState('all');

  async function loadData() {
    const [zameenData, cropsData] = await Promise.all([getZameen(), getCrops()]);
    setZameen(zameenData);
    setCrops(cropsData);

    if (!form.zameenId && zameenData.length > 0) {
      setForm((currentForm) => ({
        ...currentForm,
        zameenId: zameenData[0].id,
      }));
    }
  }

  useEffect(() => {
    let isActive = true;

    Promise.all([getZameen(), getCrops()])
      .then(([zameenData, cropsData]) => {
        if (!isActive) return;

        setZameen(zameenData);
        setCrops(cropsData);

        if (zameenData.length > 0) {
          setForm((currentForm) =>
            currentForm.zameenId
              ? currentForm
              : { ...currentForm, zameenId: zameenData[0].id },
          );
        }
      })
      .catch((loadError) => {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load crops.');
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

    const areaValue = Number(form.cropAreaValue);
    const cropAreaSqft = toSquareFeet(areaValue, form.cropAreaUnit as AreaUnit);
    const startPeriod = splitStartPeriod(form.startPeriod);

    try {
      const payload = {
        zameenId: form.zameenId,
        cropName: form.cropName,
        cropAreaValue: areaValue,
        cropAreaUnit: form.cropAreaUnit,
        cropAreaSqft,
        ...startPeriod,
        status: form.status,
      };

      if (editingCropId) {
        await updateCrop(editingCropId, payload);
        onNotify('Record Updated Successfully');
      } else {
        await createCrop(payload);
        onNotify('Crop Added Successfully');
      }

      setForm({
        ...initialForm,
        zameenId: form.zameenId,
      });
      setEditingCropId(null);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save crop.');
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(crop: Crop) {
    setEditingCropId(crop.id);
    setForm({
      zameenId: crop.zameenId,
      cropName: crop.cropName,
      cropAreaValue: String(crop.cropAreaValue),
      cropAreaUnit: crop.cropAreaUnit,
      startPeriod: cropStartPeriod(crop),
      status: cropStatuses.includes(crop.status) ? crop.status : 'Active',
    });
  }

  function cancelEdit() {
    setEditingCropId(null);
    setForm({
      ...initialForm,
      zameenId: zameen[0]?.id ?? '',
    });
  }

  async function handleDelete(crop: Crop) {
    const confirmed = window.confirm(`Delete crop "${crop.cropName}"?`);

    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await deleteCrop(crop.id);
      onNotify('Record Deleted Successfully');
      if (editingCropId === crop.id) {
        cancelEdit();
      }
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Failed to delete crop.',
      );
    }
  }

  const sortedZameen = [...zameen].sort((firstItem, secondItem) =>
    firstItem.zameenName.localeCompare(secondItem.zameenName),
  );
  const visibleZameen =
    zameenFilter === 'all'
      ? sortedZameen
      : sortedZameen.filter((item) => item.id === zameenFilter);
  const visibleCrops =
    zameenFilter === 'all'
      ? crops
      : crops.filter((crop) => crop.zameenId === zameenFilter);
  const groupedCrops = groupByParent(
    visibleZameen,
    visibleCrops,
    (item) => item.id,
    (item) => item.zameenName,
    (crop) => crop.zameenId,
  );

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">Crops</p>
          <h1>Crop Allocations</h1>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="content-grid">
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>{editingCropId ? 'Edit Crop' : 'Create Crop'}</h2>
            {editingCropId ? (
              <button className="text-button" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>

          <label>
            <FieldLabel required>Zameen</FieldLabel>
            <select
              required
              value={form.zameenId}
              onChange={(event) => setForm({ ...form, zameenId: event.target.value })}
            >
              {zameen.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.zameenName}
                </option>
              ))}
            </select>
          </label>

          <label>
            <FieldLabel required>Crop Name</FieldLabel>
            <select
              value={form.cropName}
              onChange={(event) => setForm({ ...form, cropName: event.target.value })}
            >
              {cropNames.map((cropName) => (
                <option key={cropName}>{cropName}</option>
              ))}
            </select>
          </label>

          <label>
            <FieldLabel required>Crop Area</FieldLabel>
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              value={form.cropAreaValue}
              onChange={(event) => setForm({ ...form, cropAreaValue: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel required>Area Unit</FieldLabel>
            <select
              value={form.cropAreaUnit}
              onChange={(event) => setForm({ ...form, cropAreaUnit: event.target.value })}
            >
              {AREA_UNITS.filter((unit) => unit !== 'Murabba').map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          </label>

          <label>
            <FieldLabel required>Start Period</FieldLabel>
            <input
              required
              type="month"
              value={form.startPeriod}
              onChange={(event) => setForm({ ...form, startPeriod: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel required>Status</FieldLabel>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              {cropStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <button className="primary-button" disabled={isSaving || zameen.length === 0} type="submit">
            {isSaving
              ? 'Saving...'
              : editingCropId
                ? 'Update Crop'
                : 'Create Crop'}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Crops</p>
              <h2>{visibleCrops.length} Total</h2>
            </div>
            <select
              className="inline-filter"
              value={zameenFilter}
              onChange={(event) => setZameenFilter(event.target.value)}
            >
              <option value="all">All Zameen</option>
              {sortedZameen.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.zameenName}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <p className="muted">Loading Crops...</p>
          ) : groupedCrops.length === 0 ? (
            <p className="muted">No Crop Records Yet.</p>
          ) : (
            <div className="grouped-records">
              {groupedCrops.map((group) => (
                <article className="record-group" key={group.key}>
                  <div className="record-group-header">
                    <h3>{group.label}</h3>
                    <span>{group.items.length} Crops</span>
                  </div>

                  <div className="record-list">
                    {group.items
                      .sort((firstCrop, secondCrop) =>
                        firstCrop.cropName.localeCompare(secondCrop.cropName),
                      )
                      .map((crop) => (
                        <article className="record-card" key={crop.id}>
                          <div>
                            <p className="eyebrow">Crop</p>
                            <h4>{crop.cropName}</h4>
                          </div>
                          <span
                            className={
                              crop.status === 'Completed'
                                ? 'status-pill status-paid'
                                : 'status-pill status-active'
                            }
                          >
                            {crop.status === 'Completed' ? 'Completed' : 'Active'}
                          </span>
                          <dl className="record-meta">
                            <div>
                              <dt>Area</dt>
                              <dd>
                                {crop.cropAreaValue} {crop.cropAreaUnit}
                              </dd>
                            </div>
                            <div>
                              <dt>Start</dt>
                              <dd>{startPeriodLabel(crop)}</dd>
                            </div>
                          </dl>
                          <div className="action-row">
                            <button type="button" onClick={() => startEdit(crop)}>
                              Edit
                            </button>
                            <button
                              className="danger-text-button"
                              type="button"
                              onClick={() => void handleDelete(crop)}
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
