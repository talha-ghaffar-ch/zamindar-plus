import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createIncome,
  getCrops,
  getIncome,
  type Crop,
  type Income,
} from '../lib/api';

const incomeTypes = ['Crop sale', 'Advance received', 'Partial payment', 'Other income'];

const initialForm = {
  cropId: '',
  incomeType: 'Crop sale',
  quantity: '',
  quantityUnit: 'maund',
  rate: '',
  totalAmount: '',
  incomeDate: '',
  paymentStatus: 'Received',
  buyerName: '',
  notes: '',
};

function dateParts(dateValue: string) {
  const date = new Date(dateValue);
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

export function IncomePage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const calculatedTotal = useMemo(() => {
    const quantity = Number(form.quantity);
    const rate = Number(form.rate);

    if (quantity > 0 && rate > 0) {
      return quantity * rate;
    }

    return Number(form.totalAmount) || 0;
  }, [form.quantity, form.rate, form.totalAmount]);

  async function loadData() {
    const [cropsData, incomeData] = await Promise.all([getCrops(), getIncome()]);
    setCrops(cropsData);
    setIncome(incomeData);

    if (!form.cropId && cropsData.length > 0) {
      setForm((currentForm) => ({
        ...currentForm,
        cropId: cropsData[0].id,
      }));
    }
  }

  useEffect(() => {
    let isActive = true;

    Promise.all([getCrops(), getIncome()])
      .then(([cropsData, incomeData]) => {
        if (!isActive) return;

        setCrops(cropsData);
        setIncome(incomeData);

        if (cropsData.length > 0) {
          setForm((currentForm) =>
            currentForm.cropId ? currentForm : { ...currentForm, cropId: cropsData[0].id },
          );
        }
      })
      .catch((loadError) => {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load income.');
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

    const parts = dateParts(form.incomeDate);

    try {
      await createIncome({
        cropId: form.cropId,
        incomeType: form.incomeType,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        quantityUnit: form.quantityUnit || undefined,
        rate: form.rate ? Number(form.rate) : undefined,
        totalAmount: calculatedTotal,
        incomeDate: form.incomeDate,
        incomeMonth: parts.month,
        incomeYear: parts.year,
        paymentStatus: form.paymentStatus || undefined,
        buyerName: form.buyerName || undefined,
        notes: form.notes || undefined,
      });

      setForm({
        ...initialForm,
        cropId: form.cropId,
      });
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create income.');
    } finally {
      setIsSaving(false);
    }
  }

  function cropName(cropId: string) {
    return crops.find((crop) => crop.id === cropId)?.cropName ?? cropId;
  }

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">Income</p>
          <h1>Crop income</h1>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="content-grid">
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <label>
            Crop
            <select
              required
              value={form.cropId}
              onChange={(event) => setForm({ ...form, cropId: event.target.value })}
            >
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.cropName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Income Type
            <select
              value={form.incomeType}
              onChange={(event) => setForm({ ...form, incomeType: event.target.value })}
            >
              {incomeTypes.map((incomeType) => (
                <option key={incomeType}>{incomeType}</option>
              ))}
            </select>
          </label>

          <label>
            Quantity
            <input
              min="0"
              step="0.01"
              type="number"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            />
          </label>

          <label>
            Quantity Unit
            <input
              value={form.quantityUnit}
              onChange={(event) => setForm({ ...form, quantityUnit: event.target.value })}
            />
          </label>

          <label>
            Rate
            <input
              min="0"
              step="0.01"
              type="number"
              value={form.rate}
              onChange={(event) => setForm({ ...form, rate: event.target.value })}
            />
          </label>

          <label>
            Total Amount
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={calculatedTotal || form.totalAmount}
              onChange={(event) => setForm({ ...form, totalAmount: event.target.value })}
            />
          </label>

          <label>
            Date
            <input
              required
              type="date"
              value={form.incomeDate}
              onChange={(event) => setForm({ ...form, incomeDate: event.target.value })}
            />
          </label>

          <label>
            Buyer Name
            <input
              value={form.buyerName}
              onChange={(event) => setForm({ ...form, buyerName: event.target.value })}
            />
          </label>

          <label>
            Payment Status
            <select
              value={form.paymentStatus}
              onChange={(event) => setForm({ ...form, paymentStatus: event.target.value })}
            >
              <option>Received</option>
              <option>Pending</option>
              <option>Partial</option>
            </select>
          </label>

          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>

          <button className="primary-button" disabled={isSaving || crops.length === 0} type="submit">
            {isSaving ? 'Saving...' : 'Create Income'}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Income</p>
              <h2>{income.length} total</h2>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Crop</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {income.map((item) => (
                  <tr key={item.id}>
                    <td>{item.incomeType}</td>
                    <td>{cropName(item.cropId)}</td>
                    <td>
                      {item.quantity ?? '-'} {item.quantityUnit ?? ''}
                    </td>
                    <td>Rs {item.totalAmount.toLocaleString()}</td>
                    <td>{new Date(item.incomeDate).toLocaleDateString()}</td>
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