import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Gauge,
  LandPlot,
  LineChart,
  PlusCircle,
  ReceiptText,
  Route,
  Sprout,
  TrendingUp,
  Wheat,
} from 'lucide-react';
import {
  getCropProfitabilityReport,
  getMonthlySummaryReport,
  getReportSummary,
  type CropProfitabilityReport,
  type MonthlySummaryReport,
  type ReportSummary,
  type User,
} from '../lib/api';

type DashboardPageProps = {
  currentUser: User;
  onNavigate: (page: string) => void;
};

type MetricTone = 'expense' | 'income' | 'profit' | 'land' | 'crop' | 'activity';

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

function percentStyle(value: number, maxValue: number) {
  const normalizedValue = maxValue > 0 ? Math.max((value / maxValue) * 100, 8) : 8;

  return {
    '--metric-level': `${Math.min(normalizedValue, 100)}%`,
  } as CSSProperties;
}

function ringStyle(value: number) {
  return {
    '--ring-value': `${Math.max(Math.min(value, 100), 0)}%`,
  } as CSSProperties;
}

export function DashboardPage({ currentUser, onNavigate }: DashboardPageProps) {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [monthlyReports, setMonthlyReports] = useState<MonthlySummaryReport[]>([]);
  const [cropReports, setCropReports] = useState<CropProfitabilityReport[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    Promise.all([
      getReportSummary(),
      getMonthlySummaryReport(),
      getCropProfitabilityReport(),
    ])
      .then(([summaryData, monthlyData, cropData]) => {
        if (!isActive) return;

        setSummary(summaryData);
        setMonthlyReports(monthlyData);
        setCropReports(cropData);
      })
      .catch((loadError) => {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load dashboard.',
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const transactionCount = summary
    ? summary.expenseCount + summary.incomeCount
    : 0;
  const maxMoneyValue = useMemo(
    () =>
      Math.max(
        summary?.totalExpense ?? 0,
        summary?.totalIncome ?? 0,
        Math.abs(summary?.netProfit ?? 0),
        1,
      ),
    [summary],
  );
  const profitMargin =
    summary && summary.totalIncome > 0
      ? Math.round((summary.netProfit / summary.totalIncome) * 100)
      : 0;
  const expenseShare =
    summary && summary.totalExpense + summary.totalIncome > 0
      ? Math.round(
          (summary.totalExpense / (summary.totalExpense + summary.totalIncome)) *
            100,
        )
      : 0;
  const recordCount = summary
    ? summary.zameenCount +
      summary.cropCount +
      summary.expenseCount +
      summary.incomeCount
    : 0;
  const topCrop = cropReports.reduce<CropProfitabilityReport | null>(
    (bestCrop, crop) =>
      !bestCrop || crop.netProfit > bestCrop.netProfit ? crop : bestCrop,
    null,
  );
  const recentMonths = monthlyReports.slice(-6);
  const maxMonthlyValue = Math.max(
    ...recentMonths.map((report) =>
      Math.max(report.totalExpense, report.totalIncome, Math.abs(report.netProfit)),
    ),
    1,
  );

  const metricCards: Array<{
    label: string;
    value: string;
    hint: string;
    tone: MetricTone;
    icon: typeof BanknoteArrowDown;
    rawValue: number;
  }> = [
    {
      label: 'Expense',
      value: summary ? formatCurrency(summary.totalExpense) : 'Loading...',
      hint: `${expenseShare}% of movement`,
      tone: 'expense',
      icon: BanknoteArrowDown,
      rawValue: summary?.totalExpense ?? 0,
    },
    {
      label: 'Income',
      value: summary ? formatCurrency(summary.totalIncome) : 'Loading...',
      hint: 'Received And Recorded',
      tone: 'income',
      icon: BanknoteArrowUp,
      rawValue: summary?.totalIncome ?? 0,
    },
    {
      label: 'Net Profit',
      value: summary ? formatCurrency(summary.netProfit) : 'Loading...',
      hint: `${profitMargin}% margin`,
      tone: 'profit',
      icon: CircleDollarSign,
      rawValue: Math.abs(summary?.netProfit ?? 0),
    },
    {
      label: 'Zameen',
      value: summary ? summary.zameenCount.toLocaleString() : 'Loading...',
      hint: 'Managed Records',
      tone: 'land',
      icon: LandPlot,
      rawValue: summary?.zameenCount ?? 0,
    },
    {
      label: 'Crops',
      value: summary ? summary.cropCount.toLocaleString() : 'Loading...',
      hint: 'Crop Cycles',
      tone: 'crop',
      icon: Wheat,
      rawValue: summary?.cropCount ?? 0,
    },
    {
      label: 'Entries',
      value: summary ? transactionCount.toLocaleString() : 'Loading...',
      hint: 'Expense + Income',
      tone: 'activity',
      icon: ClipboardList,
      rawValue: transactionCount,
    },
  ];

  const quickActions = [
    {
      label: 'Add Profile',
      page: 'Profiles',
      icon: PlusCircle,
      hint: 'Farm Owner Or Farm Book',
    },
    {
      label: 'Add Zameen',
      page: 'Zameen',
      icon: LandPlot,
      hint: 'Land And Ownership',
    },
    {
      label: 'Add Crop',
      page: 'Crops',
      icon: Wheat,
      hint: 'Area And Season',
    },
    {
      label: 'Add Expense',
      page: 'Expenses',
      icon: ReceiptText,
      hint: 'Kharcha Entry',
    },
    {
      label: 'Add Income',
      page: 'Income',
      icon: CircleDollarSign,
      hint: 'Sale Or Payment',
    },
    {
      label: 'Open Reports',
      page: 'Reports',
      icon: BarChart3,
      hint: 'Profit Details',
    },
  ];

  const nextSteps = [
    {
      label: 'Land Records',
      value: summary?.zameenCount ? 'Ready' : 'Add First Zameen',
      page: 'Zameen',
    },
    {
      label: 'Crop Cycles',
      value: summary?.cropCount ? 'Tracked' : 'Create Crop Allocation',
      page: 'Crops',
    },
    {
      label: 'Money Flow',
      value: transactionCount ? 'Active' : 'Record Expense Or Income',
      page: transactionCount ? 'Reports' : 'Expenses',
    },
  ];

  return (
    <section className="dashboard-screen">
      <div className="dashboard-titlebar">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Farm Command Center</h1>
        </div>
        <div className="dashboard-user-chip">
          <Sprout size={16} aria-hidden="true" />
          <span>{currentUser.farmerType ?? 'Farmer'}</span>
          <strong>{currentUser.preferredAreaUnit} / {currentUser.preferredCurrency}</strong>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="dashboard-grid">
        <section className="panel dashboard-profit-panel">
          <div className="panel-header compact-panel-header">
            <div>
              <p className="eyebrow">Financial Pulse</p>
              <h2>{summary ? formatCurrency(summary.netProfit) : 'Loading...'}</h2>
            </div>
            <Gauge size={22} aria-hidden="true" />
          </div>

          <div className="profit-ring" style={ringStyle(profitMargin)}>
            <strong>{summary ? `${profitMargin}%` : '--'}</strong>
            <span>Profit Margin</span>
          </div>

          <div className="cash-mini-list">
            <div>
              <span>
                <ArrowDownRight size={15} aria-hidden="true" />
                Expense
              </span>
              <b>{summary ? formatCurrency(summary.totalExpense) : 'Loading...'}</b>
            </div>
            <div>
              <span>
                <ArrowUpRight size={15} aria-hidden="true" />
                Income
              </span>
              <b>{summary ? formatCurrency(summary.totalIncome) : 'Loading...'}</b>
            </div>
          </div>
        </section>

        <section className="metric-grid dashboard-metrics">
          {metricCards.map((card) => (
            <article
              className={`metric-card metric-card-${card.tone}`}
              key={card.label}
              style={percentStyle(card.rawValue, maxMoneyValue || transactionCount)}
            >
              <div className="metric-card-header">
                <span>{card.label}</span>
                <card.icon size={18} aria-hidden="true" />
              </div>
              <strong>{card.value}</strong>
              <p>{card.hint}</p>
              <div className="metric-level" aria-hidden="true" />
            </article>
          ))}
        </section>

        <section className="panel quick-actions-panel">
          <div className="panel-header compact-panel-header">
            <div>
              <p className="eyebrow">Fast Work</p>
              <h2>Direct Actions</h2>
            </div>
            <Route size={20} aria-hidden="true" />
          </div>

          <div className="quick-action-grid">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => onNavigate(action.page)}
              >
                <action.icon size={18} aria-hidden="true" />
                <span>{action.label}</span>
                <small>{action.hint}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="panel dashboard-chart-panel">
          <div className="panel-header compact-panel-header">
            <div>
              <p className="eyebrow">Monthly Movement</p>
              <h2>{recentMonths.length ? `${recentMonths.length} Month Trend` : 'No Monthly Data'}</h2>
            </div>
            <LineChart size={20} aria-hidden="true" />
          </div>

          <div className="monthly-chart" aria-label="Monthly income, expense, and profit chart">
            {recentMonths.length === 0 ? (
              <p className="muted">Monthly Reports Will Appear When Income And Expenses Are Recorded.</p>
            ) : (
              recentMonths.map((report) => (
                <div className="monthly-column" key={`${report.year}-${report.month}`}>
                  <div className="monthly-bars">
                    <span
                      className="monthly-bar income-fill"
                      style={percentStyle(report.totalIncome, maxMonthlyValue)}
                    />
                    <span
                      className="monthly-bar expense-fill"
                      style={percentStyle(report.totalExpense, maxMonthlyValue)}
                    />
                    <span
                      className="monthly-bar profit-fill"
                      style={percentStyle(Math.abs(report.netProfit), maxMonthlyValue)}
                    />
                  </div>
                  <small>{formatMonth(report)}</small>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel dashboard-health-panel">
          <div className="panel-header compact-panel-header">
            <div>
              <p className="eyebrow">Record Health</p>
              <h2>{recordCount.toLocaleString()} Records</h2>
            </div>
            <TrendingUp size={20} aria-hidden="true" />
          </div>

          <div className="health-list">
            {nextSteps.map((step) => (
              <button key={step.label} type="button" onClick={() => onNavigate(step.page)}>
                <span>{step.label}</span>
                <strong>{step.value}</strong>
              </button>
            ))}
          </div>

          <div className="top-crop-card">
            <CalendarDays size={18} aria-hidden="true" />
            <span>Best Crop</span>
            <strong>
              {topCrop
                ? `${topCrop.cropName} - ${formatCurrency(topCrop.netProfit)}`
                : 'Waiting For Crop Income'}
            </strong>
          </div>
        </section>
      </div>
    </section>
  );
}
