import { useEffect, useState } from 'react';
import { getReportSummary, getUsers, type ReportSummary, type User } from '../lib/api';

export function DashboardPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [summaryData, usersData] = await Promise.all([
          getReportSummary(),
          getUsers(),
        ]);

        setSummary(summaryData);
        setUsers(usersData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard.');
      }
    }

    void loadDashboard();
  }, []);

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Farm ledger overview</h1>
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

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Users</p>
            <h2>Registered farmers</h2>
          </div>
          <span>{users.length} total</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Farmer Type</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone ?? '-'}</td>
                  <td>{user.farmerType ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}