import { type FormEvent, useEffect, useState } from 'react';
import { AREA_UNITS, toSquareFeet, type AreaUnit } from '@zamindar/shared';

import {
  createCrop,
  getCrops,
  getZameen,
  type Crop,
  type Zameen,
} from '../lib/api';

const cropNames = ['Wheat', 'Rice', 'Sugarcane', 'Cotton', 'Maize', 'Fodder'];

const initialForm = {
  zameenId: '',
  cropName: 'Wheat',
  cropAreaValue: '',
  cropAreaUnit: 'Acre',
  startMonth: '1',
  startYear: '2026',
  status: 'Active',
  notes: '',
};

export function CropsPage() {
  const [zameen, setZameen] = useState<Zameen[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
    try {
      await createCrop({
        zameenId: form.zameenId,
        cropName: form.cropName,
        cropAreaValue: areaValue,
        cropAreaUnit: form.cropAreaUnit,
        cropAreaSqft,
        startMonth: Number(form.startMonth),
        startYear: Number(form.startYear),
        status: form.status,
        notes: form.notes || undefined,
      });

      setForm({
        ...initialForm,
        zameenId: form.zameenId,
      });
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create crop.');
    } finally {
      setIsSaving(false);
    }
  }

  function zameenName(zameenId: string) {
    return zameen.find((item) => item.id === zameenId)?.zameenName ?? zameenId;
  }

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">Crops</p>
          <h1>Crop allocations</h1>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="content-grid">
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <label>
            Zameen
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
            Crop Name
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
            Crop Area
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
            Area Unit
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
            Start Month
            <input
              min="1"
              max="12"
              type="number"
              value={form.startMonth}
              onChange={(event) => setForm({ ...form, startMonth: event.target.value })}
            />
          </label>

          <label>
            Start Year
            <input
              min="1900"
              type="number"
              value={form.startYear}
              onChange={(event) => setForm({ ...form, startYear: event.target.value })}
            />
          </label>

          <label>
            Status
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option>Active</option>
              <option>Completed</option>
              <option>Archived</option>
            </select>
          </label>

          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>

          <button className="primary-button" disabled={isSaving || zameen.length === 0} type="submit">
            {isSaving ? 'Saving...' : 'Create Crop'}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Crops</p>
              <h2>{crops.length} total</h2>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Zameen</th>
                  <th>Area</th>
                  <th>Start</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {crops.map((crop) => (
                  <tr key={crop.id}>
                    <td>{crop.cropName}</td>
                    <td>{zameenName(crop.zameenId)}</td>
                    <td>
                      {crop.cropAreaValue} {crop.cropAreaUnit}
                    </td>
                    <td>
                      {crop.startMonth ?? '-'} / {crop.startYear ?? '-'}
                    </td>
                    <td>{crop.status}</td>
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