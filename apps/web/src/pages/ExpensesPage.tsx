import { type FormEvent, useEffect, useState } from 'react';
import {
  createExpense,
  getCrops,
  getExpenses,
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

export function ExpensesPage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      await createExpense({
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
      });

      setForm({
        ...initialForm,
        cropId: form.cropId,
      });
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create expense.');
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
          <p className="eyebrow">Expenses</p>
          <h1>Crop expenses</h1>
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
            {isSaving ? 'Saving...' : 'Create Expense'}
          </button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Expenses</p>
              <h2>{expenses.length} total</h2>
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
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.description}</td>
                    <td>{cropName(expense.cropId)}</td>
                    <td>{expense.expenseCategory}</td>
                    <td>Rs {expense.amount.toLocaleString()}</td>
                    <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
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