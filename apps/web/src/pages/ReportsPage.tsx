import { useEffect, useState } from 'react';
import {
  getCropProfitabilityReport,
  getMonthlySummaryReport,
  getReportSummary,
  type CropProfitabilityReport,
  type MonthlySummaryReport,
  type ReportSummary,
} from '../lib/api';

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatMonth(report: MonthlySummaryReport) {
  return `${monthNames[report.month - 1] ?? report.month} ${report.year}`;
}

export function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [cropReports, setCropReports] = useState<CropProfitabilityReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlySummaryReport[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    Promise.all([
      getReportSummary(),
      getCropProfitabilityReport(),
      getMonthlySummaryReport(),
    ])
      .then(([summaryData, cropReportData, monthlyReportData]) => {
        if (!isActive) return;

        setSummary(summaryData);
        setCropReports(cropReportData);
        setMonthlyReports(monthlyReportData);
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
              <p className="eyebrow">Crop Profitability</p>
              <h2>{cropReports.length} crops</h2>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Zameen</th>
                  <th>Status</th>
                  <th>Expense</th>
                  <th>Income</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {cropReports.map((report) => (
                  <tr key={report.cropId}>
                    <td>{report.cropName}</td>
                    <td>{report.zameenName}</td>
                    <td>{report.status}</td>
                    <td>Rs {report.totalExpense.toLocaleString()}</td>
                    <td>Rs {report.totalIncome.toLocaleString()}</td>
                    <td>Rs {report.netProfit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Monthly Summary</p>
              <h2>{monthlyReports.length} months</h2>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Expense</th>
                  <th>Income</th>
                  <th>Net</th>
                  <th>Records</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReports.map((report) => (
                  <tr key={`${report.year}-${report.month}`}>
                    <td>{formatMonth(report)}</td>
                    <td>Rs {report.totalExpense.toLocaleString()}</td>
                    <td>Rs {report.totalIncome.toLocaleString()}</td>
                    <td>Rs {report.netProfit.toLocaleString()}</td>
                    <td>{report.expenseCount + report.incomeCount}</td>
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
