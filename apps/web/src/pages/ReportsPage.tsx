import { useEffect, useState } from 'react';
import {
  getExpenses,
  getIncome,
  getReportSummary,
  type Expense,
  type Income,
  type ReportSummary,
} from '../lib/api';

export function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    Promise.all([getReportSummary(), getExpenses(), getIncome()])
      .then(([summaryData, expensesData, incomeData]) => {
        if (!isActive) return;

        setSummary(summaryData);
        setExpenses(expensesData);
        setIncome(incomeData);
      })
      .catch((loadError) => {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load reports.');
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>Profit and loss summary</h1>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="summary-grid">
        <article>
          <span>Total Expense</span>
          <strong>{summary ? `Rs ${summary.totalExpense.toLocaleString()}` : 'Loading...'}</strong>
        </article>
        <article>
          <span>Total Income</span>
          <strong>{summary ? `Rs ${summary.totalIncome.toLocaleString()}` : 'Loading...'}</strong>
        </article>
        <article>
          <span>Net Profit</span>
          <strong>{summary ? `Rs ${summary.netProfit.toLocaleString()}` : 'Loading...'}</strong>
        </article>
      </section>

      <section className="report-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Expenses</p>
              <h2>{expenses.length} records</h2>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.description}</td>
                    <td>{expense.expenseCategory}</td>
                    <td>Rs {expense.amount.toLocaleString()}</td>
                    <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Income</p>
              <h2>{income.length} records</h2>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Buyer</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {income.map((item) => (
                  <tr key={item.id}>
                    <td>{item.incomeType}</td>
                    <td>{item.buyerName ?? '-'}</td>
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