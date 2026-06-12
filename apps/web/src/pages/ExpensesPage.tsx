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
  paymentMethod: 'Cash',
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

export function ExpensesPage() {
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
        paymentStatus: form.paymentStatus || undefined,
        paymentMethod: form.paymentMethod || undefined,
        notes: form.notes || undefined,
      };

      if (editingExpenseId) {
        await updateExpense(editingExpenseId, payload);
      } else {
        await createExpense(payload);
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
      paymentStatus: expense.paymentStatus ?? 'Paid',
      paymentMethod: expense.paymentMethod ?? 'Cash',
      notes: expense.notes ?? '',
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

  function cropName(cropId: string) {
    return crops.find((crop) => crop.id === cropId)?.cropName ?? cropId;
  }

  const filteredExpenses =
    cropFilter === 'all'
      ? expenses
      : expenses.filter((expense) => expense.cropId === cropFilter);

  const filteredExpenseTotal = filteredExpenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">Expenses</p>
          <h1>Crop expenses</h1>
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
            Category
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
            Description
            <input
              required
              minLength={2}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>

          <label>
            Amount
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
            Date
            <input
              required
              type="date"
              value={form.expenseDate}
              onChange={(event) => setForm({ ...form, expenseDate: event.target.value })}
            />
          </label>

          <label>
            Payment Status
            <select
              value={form.paymentStatus}
              onChange={(event) => setForm({ ...form, paymentStatus: event.target.value })}
            >
              <option>Paid</option>
              <option>Unpaid</option>
              <option>Partial</option>
            </select>
          </label>

          <label>
            Payment Method
            <input
              value={form.paymentMethod}
              onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}
            />
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
              : editingExpenseId
                ? 'Update Expense'
                : 'Create Expense'}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Expenses</p>
              <h2>{filteredExpenses.length} total</h2>
            </div>
            <div className="panel-actions">
              <strong>Rs {filteredExpenseTotal.toLocaleString()}</strong>
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
                  <th>Description</th>
                  <th>Crop</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6}>Loading expenses...</td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No expense records yet.</td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.description}</td>
                    <td>{cropName(expense.cropId)}</td>
                    <td>{expense.expenseCategory}</td>
                    <td>Rs {expense.amount.toLocaleString()}</td>
                    <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
                    <td>
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
