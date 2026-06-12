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
      hint: 'Received and recorded',
      tone: 'income',
      icon: BanknoteArrowUp,
      rawValue: summary?.totalIncome ?? 0,
    },
    {
      label: 'Net profit',
      value: summary ? formatCurrency(summary.netProfit) : 'Loading...',
      hint: `${profitMargin}% margin`,
      tone: 'profit',
      icon: CircleDollarSign,
      rawValue: Math.abs(summary?.netProfit ?? 0),
    },
    {
      label: 'Zameen',
      value: summary ? summary.zameenCount.toLocaleString() : 'Loading...',
      hint: 'Managed records',
      tone: 'land',
      icon: LandPlot,
      rawValue: summary?.zameenCount ?? 0,
    },
    {
      label: 'Crops',
      value: summary ? summary.cropCount.toLocaleString() : 'Loading...',
      hint: 'Crop cycles',
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
      label: 'Add profile',
      page: 'Profiles',
      icon: PlusCircle,
      hint: 'Farm owner or farm book',
    },
    {
      label: 'Add zameen',
      page: 'Zameen',
      icon: LandPlot,
      hint: 'Land and ownership',
    },
    {
      label: 'Add crop',
      page: 'Crops',
      icon: Wheat,
      hint: 'Area and season',
    },
    {
      label: 'Add expense',
      page: 'Expenses',
      icon: ReceiptText,
      hint: 'Kharcha entry',
    },
    {
      label: 'Add income',
      page: 'Income',
      icon: CircleDollarSign,
      hint: 'Sale or payment',
    },
    {
      label: 'Open reports',
      page: 'Reports',
      icon: BarChart3,
      hint: 'Profit details',
    },
  ];

  const nextSteps = [
    {
      label: 'Land records',
      value: summary?.zameenCount ? 'Ready' : 'Add first zameen',
      page: 'Zameen',
    },
    {
      label: 'Crop cycles',
      value: summary?.cropCount ? 'Tracked' : 'Create crop allocation',
      page: 'Crops',
    },
    {
      label: 'Money flow',
      value: transactionCount ? 'Active' : 'Record expense or income',
      page: transactionCount ? 'Reports' : 'Expenses',
    },
  ];

  return (
    <section className="dashboard-screen">
      <div className="dashboard-titlebar">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Farm command center</h1>
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
              <p className="eyebrow">Financial pulse</p>
              <h2>{summary ? formatCurrency(summary.netProfit) : 'Loading...'}</h2>
            </div>
            <Gauge size={22} aria-hidden="true" />
          </div>

          <div className="profit-ring" style={ringStyle(profitMargin)}>
            <strong>{summary ? `${profitMargin}%` : '--'}</strong>
            <span>Profit margin</span>
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
              <p className="eyebrow">Fast work</p>
              <h2>Direct actions</h2>
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
              <p className="eyebrow">Monthly movement</p>
              <h2>{recentMonths.length ? `${recentMonths.length} month trend` : 'No monthly data'}</h2>
            </div>
            <LineChart size={20} aria-hidden="true" />
          </div>

          <div className="monthly-chart" aria-label="Monthly income, expense, and profit chart">
            {recentMonths.length === 0 ? (
              <p className="muted">Monthly reports will appear when income and expenses are recorded.</p>
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
              <p className="eyebrow">Record health</p>
              <h2>{recordCount.toLocaleString()} records</h2>
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
            <span>Best crop</span>
            <strong>
              {topCrop
                ? `${topCrop.cropName} - ${formatCurrency(topCrop.netProfit)}`
                : 'Waiting for crop income'}
            </strong>
          </div>
        </section>
      </div>
    </section>
  );
}
