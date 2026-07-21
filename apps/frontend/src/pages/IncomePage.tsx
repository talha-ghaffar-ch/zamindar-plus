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
import { useI18n } from '../i18n/useT';
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
  const { t, format } = useI18n();
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
          setError(loadError instanceof Error ? loadError.message : t('income.loadFailed'));
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
        onNotify(t('records.updated'));
      } else {
        await createIncome(payload);
        onNotify(t('income.created'));
      }

      setForm({
        ...initialForm,
        cropId: form.cropId,
      });
      setEditingIncomeId(null);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('income.saveFailed'));
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
      onNotify(t('records.deleted'));
      if (editingIncomeId === item.id) {
        cancelEdit();
      }
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : t('income.deleteFailed'),
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
          <p className="eyebrow">{t('income.eyebrow')}</p>
          <h1>{t('income.title')}</h1>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="content-grid">
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>{editingIncomeId ? t('income.editTitle') : t('income.createTitle')}</h2>
            {editingIncomeId ? (
              <button className="text-button" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>

          <label>
            <FieldLabel required>{t('income.crop')}</FieldLabel>
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
            <FieldLabel>{t('income.quantity')}</FieldLabel>
            <input
              min="0"
              step="0.01"
              type="number"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel>{t('income.quantityUnit')}</FieldLabel>
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
            <FieldLabel>{t('income.rate')}</FieldLabel>
            <input
              min="0"
              step="0.01"
              type="number"
              value={form.rate}
              onChange={(event) => setForm({ ...form, rate: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel required>{t('income.totalAmount')}</FieldLabel>
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
            <FieldLabel required>{t('income.date')}</FieldLabel>
            <input
              required
              type="date"
              value={form.incomeDate}
              onChange={(event) => setForm({ ...form, incomeDate: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel>{t('income.buyerName')}</FieldLabel>
            <input
              value={form.buyerName}
              onChange={(event) => setForm({ ...form, buyerName: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel required>{t('income.paymentStatus')}</FieldLabel>
            <select
              value={form.paymentStatus}
              onChange={(event) => setForm({ ...form, paymentStatus: event.target.value })}
            >
              <option value="Received">{t('income.received')}</option>
              <option value="Pending">{t('income.pending')}</option>
            </select>
          </label>

          <button className="primary-button" disabled={isSaving || crops.length === 0} type="submit">
            {isSaving
              ? t('common.saving')
              : editingIncomeId
                ? t('income.updateButton')
                : t('income.createButton')}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t('income.eyebrow')}</p>
              <h2>{visibleIncome.length} Total</h2>
            </div>
            <div className="panel-actions">
              <strong>{format.currency(filteredIncomeTotal)}</strong>
              <select
                className="inline-filter"
                value={cropFilter}
                onChange={(event) => setCropFilter(event.target.value)}
              >
                <option value="all">{t('income.allCrops')}</option>
                {sortedCrops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.cropName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <p className="muted">{t('income.loading')}</p>
          ) : groupedIncome.length === 0 ? (
            <p className="muted">{t('income.empty')}</p>
          ) : (
            <div className="grouped-records">
              {groupedIncome.map((cropGroup) => (
                <article className="record-group" key={cropGroup.key}>
                  <div className="record-group-header">
                    <h3>{cropGroup.label}</h3>
                    <span>
                      {format.currency(
                        cropGroup.items.reduce(
                          (total, item) => total + item.totalAmount,
                          0,
                        ),
                      )}
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
                          {format.currency(
                            monthGroup.items.reduce(
                              (total, item) => total + item.totalAmount,
                              0,
                            ),
                          )}
                        </span>
                      </div>

                      <div className="record-list">
                        {sortByDateAscending(monthGroup.items, (item) => item.incomeDate).map(
                          (item) => (
                            <article className="record-card" key={item.id}>
                              <div>
                                <p className="eyebrow">{t('income.colBuyer')}</p>
                                <h4>{item.buyerName ?? t('income.buyerNotSet')}</h4>
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
                                  {item.paymentStatus === 'Pending'
                                    ? t('income.pending')
                                    : t('income.received')}
                                </span>
                              </div>
                              <dl className="record-meta">
                                <div>
                                  <dt>{t('income.colQuantity')}</dt>
                                  <dd>
                                    {item.quantity ?? '-'} {item.quantityUnit ?? ''}
                                  </dd>
                                </div>
                                <div>
                                  <dt>{t('income.colRate')}</dt>
                                  <dd>{item.rate ? format.currency(item.rate) : '-'}</dd>
                                </div>
                                <div>
                                  <dt>{t('income.colTotal')}</dt>
                                  <dd>{format.currency(item.totalAmount)}</dd>
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
