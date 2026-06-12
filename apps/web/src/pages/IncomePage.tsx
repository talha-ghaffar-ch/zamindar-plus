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
import { FieldLabel } from '../components/FieldLabel';
import {
  dateInputValue,
  dateParts,
  formatDate,
  groupByMonth,
  groupByParent,
  sortByDateAscending,
} from '../lib/recordGrouping';

type IncomePageProps = {
  onNotify: (message: string) => void;
};

const quantityUnits = [
  'Maund',
  'Kg',
  'Ton',
  'Quintal',
  'Bag / Bori',
  'Crate',
  'Bale',
  'Trolley',
  'Liter',
];

const initialForm = {
  cropId: '',
  quantity: '',
  quantityUnit: 'Maund',
  rate: '',
  totalAmount: '',
  incomeDate: '',
  paymentStatus: 'Received',
  buyerName: '',
};

export function IncomePage({ onNotify }: IncomePageProps) {
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
        quantity: form.quantity ? Number(form.quantity) : undefined,
        quantityUnit: form.quantityUnit || undefined,
        rate: form.rate ? Number(form.rate) : undefined,
        totalAmount: calculatedTotal,
        incomeDate: form.incomeDate,
        incomeMonth: parts.month,
        incomeYear: parts.year,
        paymentStatus: form.paymentStatus,
        buyerName: form.buyerName || undefined,
      };

      if (editingIncomeId) {
        await updateIncome(editingIncomeId, payload);
        onNotify('Record Updated Successfully');
      } else {
        await createIncome(payload);
        onNotify('Income Added Successfully');
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
      quantity: item.quantity ? String(item.quantity) : '',
      quantityUnit: item.quantityUnit ?? 'Maund',
      rate: item.rate ? String(item.rate) : '',
      totalAmount: String(item.totalAmount),
      incomeDate: dateInputValue(item.incomeDate),
      paymentStatus: item.paymentStatus === 'Pending' ? 'Pending' : 'Received',
      buyerName: item.buyerName ?? '',
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
    const confirmed = window.confirm(`Delete income record from ${formatDate(item.incomeDate)}?`);

    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await deleteIncome(item.id);
      onNotify('Record Deleted Successfully');
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

  const sortedCrops = [...crops].sort((firstCrop, secondCrop) =>
    firstCrop.cropName.localeCompare(secondCrop.cropName),
  );
  const visibleCrops =
    cropFilter === 'all'
      ? sortedCrops
      : sortedCrops.filter((crop) => crop.id === cropFilter);
  const visibleIncome =
    cropFilter === 'all'
      ? income
      : income.filter((item) => item.cropId === cropFilter);
  const sortedIncome = sortByDateAscending(visibleIncome, (item) => item.incomeDate);
  const groupedIncome = groupByParent(
    visibleCrops,
    sortedIncome,
    (crop) => crop.id,
    (crop) => crop.cropName,
    (item) => item.cropId,
  );
  const filteredIncomeTotal = visibleIncome.reduce(
    (total, item) => total + item.totalAmount,
    0,
  );

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">Income</p>
          <h1>Crop Income</h1>
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
            <FieldLabel required>Crop</FieldLabel>
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
            <FieldLabel>Quantity</FieldLabel>
            <input
              min="0"
              step="0.01"
              type="number"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel>Quantity Unit</FieldLabel>
            <select
              value={form.quantityUnit}
              onChange={(event) => setForm({ ...form, quantityUnit: event.target.value })}
            >
              {quantityUnits.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          </label>

          <label>
            <FieldLabel>Rate</FieldLabel>
            <input
              min="0"
              step="0.01"
              type="number"
              value={form.rate}
              onChange={(event) => setForm({ ...form, rate: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel required>Total Amount</FieldLabel>
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
            <FieldLabel required>Date</FieldLabel>
            <input
              required
              type="date"
              value={form.incomeDate}
              onChange={(event) => setForm({ ...form, incomeDate: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel>Buyer Name</FieldLabel>
            <input
              value={form.buyerName}
              onChange={(event) => setForm({ ...form, buyerName: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel required>Payment Status</FieldLabel>
            <select
              value={form.paymentStatus}
              onChange={(event) => setForm({ ...form, paymentStatus: event.target.value })}
            >
              <option>Received</option>
              <option>Pending</option>
            </select>
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
              <h2>{visibleIncome.length} Total</h2>
            </div>
            <div className="panel-actions">
              <strong>Rs {filteredIncomeTotal.toLocaleString()}</strong>
              <select
                className="inline-filter"
                value={cropFilter}
                onChange={(event) => setCropFilter(event.target.value)}
              >
                <option value="all">All Crops</option>
                {sortedCrops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.cropName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <p className="muted">Loading Income...</p>
          ) : groupedIncome.length === 0 ? (
            <p className="muted">No Income Records Yet.</p>
          ) : (
            <div className="grouped-records">
              {groupedIncome.map((cropGroup) => (
                <article className="record-group" key={cropGroup.key}>
                  <div className="record-group-header">
                    <h3>{cropGroup.label}</h3>
                    <span>
                      Rs{' '}
                      {cropGroup.items
                        .reduce((total, item) => total + item.totalAmount, 0)
                        .toLocaleString()}
                    </span>
                  </div>

                  {groupByMonth(
                    cropGroup.items,
                    (item) => item.incomeYear,
                    (item) => item.incomeMonth,
                  ).map((monthGroup) => (
                    <section className="month-group" key={monthGroup.key}>
                      <div className="month-group-header">
                        <h4>{monthGroup.label}</h4>
                        <span>
                          Rs{' '}
                          {monthGroup.items
                            .reduce((total, item) => total + item.totalAmount, 0)
                            .toLocaleString()}
                        </span>
                      </div>

                      <div className="record-list">
                        {sortByDateAscending(monthGroup.items, (item) => item.incomeDate).map(
                          (item) => (
                            <article className="record-card" key={item.id}>
                              <div>
                                <p className="eyebrow">Buyer</p>
                                <h4>{item.buyerName ?? 'Buyer Not Set'}</h4>
                              </div>
                              <div className="transaction-side">
                                <time className="transaction-date" dateTime={item.incomeDate}>
                                  {formatDate(item.incomeDate)}
                                </time>
                                <span
                                  className={
                                    item.paymentStatus === 'Pending'
                                      ? 'status-pill status-unpaid'
                                      : 'status-pill status-paid'
                                  }
                                >
                                  {item.paymentStatus === 'Pending' ? 'Pending' : 'Received'}
                                </span>
                              </div>
                              <dl className="record-meta">
                                <div>
                                  <dt>Quantity</dt>
                                  <dd>
                                    {item.quantity ?? '-'} {item.quantityUnit ?? ''}
                                  </dd>
                                </div>
                                <div>
                                  <dt>Rate</dt>
                                  <dd>{item.rate ? `Rs ${item.rate.toLocaleString()}` : '-'}</dd>
                                </div>
                                <div>
                                  <dt>Total</dt>
                                  <dd>Rs {item.totalAmount.toLocaleString()}</dd>
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
                          ),
                        )}
                      </div>
                    </section>
                  ))}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </>
  );
}
