import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  BarChart3,
  CalendarRange,
  Download,
  FileSpreadsheet,
  LineChart,
  Printer,
  ReceiptText,
  TrendingUp,
} from 'lucide-react';
import {
  getCropProfitabilityReport,
  getMonthlySummaryReport,
  getReportSummary,
  type CropProfitabilityReport,
  type MonthlySummaryReport,
  type ReportSummary,
} from '../lib/api';

type ReportMode = 'overview' | 'crops' | 'monthly';

type ReportsPageProps = {
  onNotify: (message: string) => void;
};

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

function formatCurrency(value: number) {
  return `Rs ${value.toLocaleString()}`;
}

function formatMonth(report: MonthlySummaryReport) {
  return `${monthNames[report.month - 1] ?? report.month} ${report.year}`;
}

function monthInputValue(report: MonthlySummaryReport) {
  return `${report.year}-${String(report.month).padStart(2, '0')}`;
}

function percentStyle(value: number, maxValue: number) {
  const normalizedValue = maxValue > 0 ? Math.max((value / maxValue) * 100, 6) : 6;

  return {
    '--metric-level': `${Math.min(normalizedValue, 100)}%`,
  } as CSSProperties;
}

function escapeCsv(value: string | number) {
  const text = String(value);

  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function exportCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage({ onNotify }: ReportsPageProps) {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [cropReports, setCropReports] = useState<CropProfitabilityReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlySummaryReport[]>([]);
  const [reportMode, setReportMode] = useState<ReportMode>('overview');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCropId, setSelectedCropId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  const availableYears = useMemo(
    () =>
      Array.from(new Set(monthlyReports.map((report) => report.year))).sort(
        (a, b) => b - a,
      ),
    [monthlyReports],
  );
  const filteredMonthlyReports =
    selectedYear === 'all'
      ? monthlyReports
      : monthlyReports.filter((report) => String(report.year) === selectedYear);
  const rangeFilteredMonthlyReports = filteredMonthlyReports.filter((report) => {
    const reportMonthValue = monthInputValue(report);

    return (
      (!fromMonth || reportMonthValue >= fromMonth) &&
      (!toMonth || reportMonthValue <= toMonth)
    );
  });
  const sortedCropReports = [...cropReports].sort(
    (firstCrop, secondCrop) => secondCrop.netProfit - firstCrop.netProfit,
  );
  const filteredCropReports = sortedCropReports.filter(
    (report) =>
      (selectedCropId === 'all' || report.cropId === selectedCropId) &&
      (selectedStatus === 'all' || report.status === selectedStatus),
  );
  const cropFilterOptions = sortedCropReports.map((report) => ({
    id: report.cropId,
    label: `${report.cropName} - ${report.zameenName}`,
  }));
  const statusFilterOptions = Array.from(
    new Set(sortedCropReports.map((report) => report.status).filter(Boolean)),
  ).sort();
  const maxMoneyValue = Math.max(
    summary?.totalIncome ?? 0,
    summary?.totalExpense ?? 0,
    Math.abs(summary?.netProfit ?? 0),
    ...rangeFilteredMonthlyReports.map((report) =>
      Math.max(report.totalIncome, report.totalExpense, Math.abs(report.netProfit)),
    ),
    ...filteredCropReports.map((report) =>
      Math.max(report.totalIncome, report.totalExpense, Math.abs(report.netProfit)),
    ),
    1,
  );
  const transactionCount = summary
    ? summary.expenseCount + summary.incomeCount
    : 0;
  const profitMargin =
    summary && summary.totalIncome > 0
      ? Math.round((summary.netProfit / summary.totalIncome) * 100)
      : 0;
  const bestCrop = filteredCropReports[0];
  const reportTabs: Array<{ label: string; mode: ReportMode; icon: typeof BarChart3 }> = [
    { label: 'Overview', mode: 'overview', icon: BarChart3 },
    { label: 'Crop profitability', mode: 'crops', icon: ReceiptText },
    { label: 'Monthly movement', mode: 'monthly', icon: CalendarRange },
  ];
  const hasSummaryData = summary
    ? summary.zameenCount + summary.cropCount + transactionCount > 0
    : false;
  const hasCropReportData = filteredCropReports.length > 0;
  const hasMonthlyReportData = rangeFilteredMonthlyReports.length > 0;
  const filtersAreActive =
    selectedYear !== 'all' ||
    selectedCropId !== 'all' ||
    selectedStatus !== 'all' ||
    fromMonth ||
    toMonth;

  function clearFilters() {
    setSelectedYear('all');
    setSelectedCropId('all');
    setSelectedStatus('all');
    setFromMonth('');
    setToMonth('');
  }

  function notifyNoExportData(reportName: string) {
    onNotify(`${reportName} has no data to export`);
  }

  function handleExportSummary() {
    if (!hasSummaryData) {
      notifyNoExportData('Summary report');
      return;
    }

    exportCsv('zamindar-plus-summary.csv', [
      ['Metric', 'Value'],
      ['Total Expense', summary?.totalExpense ?? 0],
      ['Total Income', summary?.totalIncome ?? 0],
      ['Net Profit', summary?.netProfit ?? 0],
      ['Zameen Records', summary?.zameenCount ?? 0],
      ['Crop Records', summary?.cropCount ?? 0],
      ['Expense Entries', summary?.expenseCount ?? 0],
      ['Income Entries', summary?.incomeCount ?? 0],
    ]);
    onNotify('Summary exported successfully');
  }

  function handleExportCrops() {
    if (!hasCropReportData) {
      notifyNoExportData('Crop report');
      return;
    }

    exportCsv('zamindar-plus-crop-profitability.csv', [
      ['Crop', 'Zameen', 'Status', 'Expense', 'Income', 'Net Profit', 'Expense Count', 'Income Count'],
      ...filteredCropReports.map((report) => [
        report.cropName,
        report.zameenName,
        report.status,
        report.totalExpense,
        report.totalIncome,
        report.netProfit,
        report.expenseCount,
        report.incomeCount,
      ]),
    ]);
    onNotify('Crop report exported successfully');
  }

  function handleExportMonthly() {
    if (!hasMonthlyReportData) {
      notifyNoExportData('Monthly report');
      return;
    }

    exportCsv('zamindar-plus-monthly-summary.csv', [
      ['Month', 'Expense', 'Income', 'Net Profit', 'Expense Count', 'Income Count'],
      ...rangeFilteredMonthlyReports.map((report) => [
        formatMonth(report),
        report.totalExpense,
        report.totalIncome,
        report.netProfit,
        report.expenseCount,
        report.incomeCount,
      ]),
    ]);
    onNotify('Monthly report exported successfully');
  }

  return (
    <section className="reports-screen">
      <section className="page-header report-page-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>Profit intelligence</h1>
        </div>
        <div className="report-actions">
          <button
            disabled={isLoading || !hasSummaryData}
            type="button"
            onClick={handleExportSummary}
          >
            <Download size={16} aria-hidden="true" />
            Summary
          </button>
          <button
            disabled={isLoading || !hasCropReportData}
            type="button"
            onClick={handleExportCrops}
          >
            <FileSpreadsheet size={16} aria-hidden="true" />
            Crops
          </button>
          <button
            disabled={isLoading || !hasMonthlyReportData}
            type="button"
            onClick={handleExportMonthly}
          >
            <FileSpreadsheet size={16} aria-hidden="true" />
            Monthly
          </button>
          <button type="button" onClick={() => window.print()}>
            <Printer size={16} aria-hidden="true" />
            Print
          </button>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="report-kpi-grid">
        <article className="report-kpi-card income">
          <BanknoteArrowUp size={20} aria-hidden="true" />
          <span>Total income</span>
          <strong>{summary ? formatCurrency(summary.totalIncome) : 'Loading...'}</strong>
        </article>
        <article className="report-kpi-card expense">
          <BanknoteArrowDown size={20} aria-hidden="true" />
          <span>Total expense</span>
          <strong>{summary ? formatCurrency(summary.totalExpense) : 'Loading...'}</strong>
        </article>
        <article className="report-kpi-card profit">
          <TrendingUp size={20} aria-hidden="true" />
          <span>Net profit</span>
          <strong>{summary ? formatCurrency(summary.netProfit) : 'Loading...'}</strong>
        </article>
        <article className="report-kpi-card activity">
          <LineChart size={20} aria-hidden="true" />
          <span>Margin</span>
          <strong>{summary ? `${profitMargin}%` : 'Loading...'}</strong>
        </article>
      </section>

      <section className="panel report-filter-panel">
        <div>
          <p className="eyebrow">Filters</p>
          <h2>Focus the report</h2>
        </div>
        <div className="report-filter-grid">
          <label>
            <span>Year</span>
            <select
              className="inline-filter"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
            >
              <option value="all">All years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Crop</span>
            <select
              className="inline-filter"
              value={selectedCropId}
              onChange={(event) => setSelectedCropId(event.target.value)}
            >
              <option value="all">All crops</option>
              {cropFilterOptions.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select
              className="inline-filter"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              <option value="all">All statuses</option>
              {statusFilterOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>From month</span>
            <input
              className="inline-filter"
              type="month"
              value={fromMonth}
              onChange={(event) => setFromMonth(event.target.value)}
            />
          </label>
          <label>
            <span>To month</span>
            <input
              className="inline-filter"
              type="month"
              value={toMonth}
              onChange={(event) => setToMonth(event.target.value)}
            />
          </label>
          <button
            className="text-button"
            disabled={!filtersAreActive}
            type="button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      </section>

      <section className="panel report-control-panel">
        <div className="report-mode-tabs" aria-label="Report type">
          {reportTabs.map((tab) => (
            <button
              aria-pressed={reportMode === tab.mode}
              className={reportMode === tab.mode ? 'active' : ''}
              key={tab.mode}
              type="button"
              onClick={() => setReportMode(tab.mode)}
            >
              <tab.icon size={17} aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="report-control-grid">
          <section className="report-visual-card">
            <p className="eyebrow">Cash comparison</p>
            <h2>Income, expense, and profit</h2>
            <div className="report-balance-bars">
              <span>
                <b>Income</b>
                <i className="income-fill" style={percentStyle(summary?.totalIncome ?? 0, maxMoneyValue)} />
                <strong>{summary ? formatCurrency(summary.totalIncome) : '--'}</strong>
              </span>
              <span>
                <b>Expense</b>
                <i className="expense-fill" style={percentStyle(summary?.totalExpense ?? 0, maxMoneyValue)} />
                <strong>{summary ? formatCurrency(summary.totalExpense) : '--'}</strong>
              </span>
              <span>
                <b>Net</b>
                <i className="profit-fill" style={percentStyle(Math.abs(summary?.netProfit ?? 0), maxMoneyValue)} />
                <strong>{summary ? formatCurrency(summary.netProfit) : '--'}</strong>
              </span>
            </div>
          </section>

          <section className="report-visual-card report-image-card">
            <p className="eyebrow">Best performer</p>
            <h2>{bestCrop ? bestCrop.cropName : 'No crop report yet'}</h2>
            <strong>
              {bestCrop ? formatCurrency(bestCrop.netProfit) : 'Add crop income to unlock'}
            </strong>
            <span>{transactionCount.toLocaleString()} money entries recorded</span>
          </section>
        </div>
      </section>

      {reportMode === 'overview' ? (
        <section className="report-detail-grid">
          <section className="panel">
            <div className="panel-header compact-panel-header">
              <div>
                <p className="eyebrow">Monthly trend</p>
                <h2>{rangeFilteredMonthlyReports.length} months</h2>
              </div>
            </div>
            <div className="monthly-chart report-monthly-chart">
              {isLoading ? (
                <p className="muted">Loading monthly reports...</p>
              ) : rangeFilteredMonthlyReports.length === 0 ? (
                <p className="muted">No monthly report data yet.</p>
              ) : (
                rangeFilteredMonthlyReports.map((report) => (
                  <div className="monthly-column" key={`${report.year}-${report.month}`}>
                    <div className="monthly-bars">
                      <span
                        className="monthly-bar income-fill"
                        style={percentStyle(report.totalIncome, maxMoneyValue)}
                      />
                      <span
                        className="monthly-bar expense-fill"
                        style={percentStyle(report.totalExpense, maxMoneyValue)}
                      />
                      <span
                        className="monthly-bar profit-fill"
                        style={percentStyle(Math.abs(report.netProfit), maxMoneyValue)}
                      />
                    </div>
                    <small>{formatMonth(report)}</small>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header compact-panel-header">
              <div>
                <p className="eyebrow">Report health</p>
                <h2>Coverage snapshot</h2>
              </div>
            </div>
            <div className="report-health-list">
              <div>
                <span>Zameen coverage</span>
                <strong>{summary?.zameenCount ?? 0} records</strong>
              </div>
              <div>
                <span>Crop coverage</span>
                <strong>{summary?.cropCount ?? 0} Cycles</strong>
              </div>
              <div>
                <span>Financial entries</span>
                <strong>{transactionCount} Entries</strong>
              </div>
            </div>
          </section>
        </section>
      ) : null}

      {reportMode === 'crops' ? (
        <section className="panel report-table-panel">
          <div className="panel-header compact-panel-header">
            <div>
              <p className="eyebrow">Crop profitability</p>
              <h2>{filteredCropReports.length} crops</h2>
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
                  <th>Entries</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7}>Loading crop reports...</td>
                  </tr>
                ) : filteredCropReports.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No crop report data yet.</td>
                  </tr>
                ) : (
                  filteredCropReports.map((report) => (
                    <tr key={report.cropId}>
                      <td>{report.cropName}</td>
                      <td>{report.zameenName}</td>
                      <td>{report.status}</td>
                      <td>{formatCurrency(report.totalExpense)}</td>
                      <td>{formatCurrency(report.totalIncome)}</td>
                      <td>{formatCurrency(report.netProfit)}</td>
                      <td>{report.expenseCount + report.incomeCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {reportMode === 'monthly' ? (
        <section className="panel report-table-panel">
          <div className="panel-header compact-panel-header">
            <div>
              <p className="eyebrow">Monthly summary</p>
              <h2>{rangeFilteredMonthlyReports.length} months</h2>
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
                {isLoading ? (
                  <tr>
                    <td colSpan={5}>Loading monthly reports...</td>
                  </tr>
                ) : rangeFilteredMonthlyReports.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No monthly report data yet.</td>
                  </tr>
                ) : (
                  rangeFilteredMonthlyReports.map((report) => (
                    <tr key={`${report.year}-${report.month}`}>
                      <td>{formatMonth(report)}</td>
                      <td>{formatCurrency(report.totalExpense)}</td>
                      <td>{formatCurrency(report.totalIncome)}</td>
                      <td>{formatCurrency(report.netProfit)}</td>
                      <td>{report.expenseCount + report.incomeCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </section>
  );
}
