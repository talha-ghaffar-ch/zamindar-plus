import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createIncome,
  deleteIncome,
  getCrops,
  getIncome,
  updateIncome,
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

function dateInputValue(dateValue: string) {
  return dateValue.slice(0, 10);
}

export function IncomePage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [cropFilter, setCropFilter] = useState('all');

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

    const parts = dateParts(form.incomeDate);

    try {
      const payload = {
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
      };

      if (editingIncomeId) {
        await updateIncome(editingIncomeId, payload);
      } else {
        await createIncome(payload);
      }

      setForm({
        ...initialForm,
        cropId: form.cropId,
      });
      setEditingIncomeId(null);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save income.');
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(item: Income) {
    setEditingIncomeId(item.id);
    setForm({
      cropId: item.cropId,
      incomeType: item.incomeType,
      quantity: item.quantity ? String(item.quantity) : '',
      quantityUnit: item.quantityUnit ?? 'maund',
      rate: item.rate ? String(item.rate) : '',
      totalAmount: String(item.totalAmount),
      incomeDate: dateInputValue(item.incomeDate),
      paymentStatus: item.paymentStatus ?? 'Received',
      buyerName: item.buyerName ?? '',
      notes: item.notes ?? '',
    });
  }

  function cancelEdit() {
    setEditingIncomeId(null);
    setForm({
      ...initialForm,
      cropId: crops[0]?.id ?? '',
    });
  }

  async function handleDelete(item: Income) {
    const confirmed = window.confirm(`Delete income "${item.incomeType}"?`);

    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await deleteIncome(item.id);
      if (editingIncomeId === item.id) {
        cancelEdit();
      }
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Failed to delete income.',
      );
    }
  }

  function cropName(cropId: string) {
    return crops.find((crop) => crop.id === cropId)?.cropName ?? cropId;
  }

  const filteredIncome =
    cropFilter === 'all'
      ? income
      : income.filter((item) => item.cropId === cropFilter);

  const filteredIncomeTotal = filteredIncome.reduce(
    (total, item) => total + item.totalAmount,
    0,
  );

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
          <div className="form-heading">
            <h2>{editingIncomeId ? 'Edit Income' : 'Create Income'}</h2>
            {editingIncomeId ? (
              <button className="text-button" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>

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
            {isSaving
              ? 'Saving...'
              : editingIncomeId
                ? 'Update Income'
                : 'Create Income'}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Income</p>
              <h2>{filteredIncome.length} total</h2>
            </div>
            <div className="panel-actions">
              <strong>Rs {filteredIncomeTotal.toLocaleString()}</strong>
              <select
                className="inline-filter"
                value={cropFilter}
                onChange={(event) => setCropFilter(event.target.value)}
              >
                <option value="all">All crops</option>
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.cropName}
                  </option>
                ))}
              </select>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6}>Loading income...</td>
                  </tr>
                ) : filteredIncome.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No income records yet.</td>
                  </tr>
                ) : (
                  filteredIncome.map((item) => (
                  <tr key={item.id}>
                    <td>{item.incomeType}</td>
                    <td>{cropName(item.cropId)}</td>
                    <td>
                      {item.quantity ?? '-'} {item.quantityUnit ?? ''}
                    </td>
                    <td>Rs {item.totalAmount.toLocaleString()}</td>
                    <td>{new Date(item.incomeDate).toLocaleDateString()}</td>
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
