import { type FormEvent, useEffect, useState } from 'react';
import {
  createExpense,
  deleteExpense,
  getCrops,
  getExpenses,
  updateExpense,
  type Crop,
  type Expense,
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

type ExpensesPageProps = {
  onNotify: (message: string) => void;
};

const categories = [
  'Land Preparation',
  'Seed / Sowing',
  'Fertilizer',
  'Spray / Pesticide',
  'Water / Irrigation',
  'Labour',
  'Machinery / Diesel',
  'Rent / Thekka',
  'Transport',
  'Other Expense',
];

const initialForm = {
  cropId: '',
  expenseCategory: 'Fertilizer',
  description: '',
  amount: '',
  expenseDate: '',
  paymentStatus: 'Paid',
};

export function ExpensesPage({ onNotify }: ExpensesPageProps) {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [cropFilter, setCropFilter] = useState('all');

  async function loadData() {
    const [cropsData, expensesData] = await Promise.all([getCrops(), getExpenses()]);
    setCrops(cropsData);
    setExpenses(expensesData);

    if (!form.cropId && cropsData.length > 0) {
      setForm((currentForm) => ({
        ...currentForm,
        cropId: cropsData[0].id,
      }));
    }
  }

  useEffect(() => {
    let isActive = true;

    Promise.all([getCrops(), getExpenses()])
      .then(([cropsData, expensesData]) => {
        if (!isActive) return;

        setCrops(cropsData);
        setExpenses(expensesData);

        if (cropsData.length > 0) {
          setForm((currentForm) =>
            currentForm.cropId ? currentForm : { ...currentForm, cropId: cropsData[0].id },
          );
        }
      })
      .catch((loadError) => {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load expenses.');
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

    const parts = dateParts(form.expenseDate);

    try {
      const payload = {
        cropId: form.cropId,
        expenseCategory: form.expenseCategory,
        description: form.description,
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        expenseMonth: parts.month,
        expenseYear: parts.year,
        paymentStatus: form.paymentStatus,
      };

      if (editingExpenseId) {
        await updateExpense(editingExpenseId, payload);
        onNotify('Record Updated Successfully');
      } else {
        await createExpense(payload);
        onNotify('Expense Added Successfully');
      }

      setForm({
        ...initialForm,
        cropId: form.cropId,
      });
      setEditingExpenseId(null);
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to save expense.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(expense: Expense) {
    setEditingExpenseId(expense.id);
    setForm({
      cropId: expense.cropId,
      expenseCategory: expense.expenseCategory,
      description: expense.description,
      amount: String(expense.amount),
      expenseDate: dateInputValue(expense.expenseDate),
      paymentStatus: expense.paymentStatus === 'Unpaid' ? 'Unpaid' : 'Paid',
    });
  }

  function cancelEdit() {
    setEditingExpenseId(null);
    setForm({
      ...initialForm,
      cropId: crops[0]?.id ?? '',
    });
  }

  async function handleDelete(expense: Expense) {
    const confirmed = window.confirm(`Delete expense "${expense.description}"?`);

    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await deleteExpense(expense.id);
      onNotify('Record Deleted Successfully');
      if (editingExpenseId === expense.id) {
        cancelEdit();
      }
      await loadData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete expense.',
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
  const visibleExpenses =
    cropFilter === 'all'
      ? expenses
      : expenses.filter((expense) => expense.cropId === cropFilter);
  const sortedExpenses = sortByDateAscending(visibleExpenses, (expense) => expense.expenseDate);
  const groupedExpenses = groupByParent(
    visibleCrops,
    sortedExpenses,
    (crop) => crop.id,
    (crop) => crop.cropName,
    (expense) => expense.cropId,
  );
  const filteredExpenseTotal = visibleExpenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">Expenses</p>
          <h1>Crop Expenses</h1>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="content-grid">
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>{editingExpenseId ? 'Edit Expense' : 'Create Expense'}</h2>
            {editingExpenseId ? (
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
            <FieldLabel required>Category</FieldLabel>
            <select
              value={form.expenseCategory}
              onChange={(event) => setForm({ ...form, expenseCategory: event.target.value })}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label>
            <FieldLabel required>Description</FieldLabel>
            <input
              required
              minLength={2}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel required>Amount</FieldLabel>
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel required>Date</FieldLabel>
            <input
              required
              type="date"
              value={form.expenseDate}
              onChange={(event) => setForm({ ...form, expenseDate: event.target.value })}
            />
          </label>

          <label>
            <FieldLabel required>Payment Status</FieldLabel>
            <select
              value={form.paymentStatus}
              onChange={(event) => setForm({ ...form, paymentStatus: event.target.value })}
            >
              <option>Paid</option>
              <option>Unpaid</option>
            </select>
          </label>

          <button className="primary-button" disabled={isSaving || crops.length === 0} type="submit">
            {isSaving
              ? 'Saving...'
              : editingExpenseId
                ? 'Update Expense'
                : 'Create Expense'}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Expenses</p>
              <h2>{visibleExpenses.length} Total</h2>
            </div>
            <div className="panel-actions">
              <strong>Rs {filteredExpenseTotal.toLocaleString()}</strong>
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
            <p className="muted">Loading Expenses...</p>
          ) : groupedExpenses.length === 0 ? (
            <p className="muted">No Expense Records Yet.</p>
          ) : (
            <div className="grouped-records">
              {groupedExpenses.map((cropGroup) => (
                <article className="record-group" key={cropGroup.key}>
                  <div className="record-group-header">
                    <h3>{cropGroup.label}</h3>
                    <span>
                      Rs{' '}
                      {cropGroup.items
                        .reduce((total, expense) => total + expense.amount, 0)
                        .toLocaleString()}
                    </span>
                  </div>

                  {groupByMonth(
                    cropGroup.items,
                    (expense) => expense.expenseYear,
                    (expense) => expense.expenseMonth,
                  ).map((monthGroup) => (
                    <section className="month-group" key={monthGroup.key}>
                      <div className="month-group-header">
                        <h4>{monthGroup.label}</h4>
                        <span>
                          Rs{' '}
                          {monthGroup.items
                            .reduce((total, expense) => total + expense.amount, 0)
                            .toLocaleString()}
                        </span>
                      </div>

                      <div className="record-list">
                        {sortByDateAscending(monthGroup.items, (expense) => expense.expenseDate).map(
                          (expense) => (
                            <article className="record-card" key={expense.id}>
                              <div>
                                <p className="eyebrow">{expense.expenseCategory}</p>
                                <h4>{expense.description}</h4>
                              </div>
                              <div className="transaction-side">
                                <time className="transaction-date" dateTime={expense.expenseDate}>
                                  {formatDate(expense.expenseDate)}
                                </time>
                                <span
                                  className={
                                    expense.paymentStatus === 'Unpaid'
                                      ? 'status-pill status-unpaid'
                                      : 'status-pill status-paid'
                                  }
                                >
                                  {expense.paymentStatus === 'Unpaid' ? 'Unpaid' : 'Paid'}
                                </span>
                              </div>
                              <dl className="record-meta">
                                <div>
                                  <dt>Category</dt>
                                  <dd>{expense.expenseCategory}</dd>
                                </div>
                                <div>
                                  <dt>Amount</dt>
                                  <dd>Rs {expense.amount.toLocaleString()}</dd>
                                </div>
                              </dl>
                              <div className="action-row">
                                <button type="button" onClick={() => startEdit(expense)}>
                                  Edit
                                </button>
                                <button
                                  className="danger-text-button"
                                  type="button"
                                  onClick={() => void handleDelete(expense)}
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
