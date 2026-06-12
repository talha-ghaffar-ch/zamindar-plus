import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  ChartNoAxesCombined,
  CircleDollarSign,
  LandPlot,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  Wheat,
} from 'lucide-react';
import { getReportSummary, type ReportSummary, type User } from '../lib/api';

type DashboardPageProps = {
  currentUser: User;
};

type MetricTone = 'expense' | 'income' | 'profit' | 'land' | 'crop' | 'activity';

function formatCurrency(value: number) {
  return `Rs ${value.toLocaleString()}`;
}

function metricStyle(value: number, maxValue: number) {
  const normalizedValue = maxValue > 0 ? Math.max((value / maxValue) * 100, 12) : 18;

  return {
    '--metric-level': `${Math.min(normalizedValue, 100)}%`,
  } as CSSProperties;
}

export function DashboardPage({ currentUser }: DashboardPageProps) {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [error, setError] = useState('');

  const maxMoneyValue = useMemo(
    () =>
      Math.max(
        summary?.totalExpense ?? 0,
        summary?.totalIncome ?? 0,
        Math.abs(summary?.netProfit ?? 0),
      ),
    [summary],
  );

  const transactionCount = summary
    ? summary.expenseCount + summary.incomeCount
    : 0;
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

  const metricCards: Array<{
    label: string;
    value: string;
    hint: string;
    tone: MetricTone;
    icon: typeof BanknoteArrowDown;
    rawValue: number;
  }> = [
    {
      label: 'Total Expense',
      value: summary ? formatCurrency(summary.totalExpense) : 'Loading...',
      hint: `${expenseShare}% of recorded cash movement`,
      tone: 'expense',
      icon: BanknoteArrowDown,
      rawValue: summary?.totalExpense ?? 0,
    },
    {
      label: 'Total Income',
      value: summary ? formatCurrency(summary.totalIncome) : 'Loading...',
      hint: 'Crop sale and received payments',
      tone: 'income',
      icon: BanknoteArrowUp,
      rawValue: summary?.totalIncome ?? 0,
    },
    {
      label: 'Net Profit',
      value: summary ? formatCurrency(summary.netProfit) : 'Loading...',
      hint: `${profitMargin}% margin from income`,
      tone: 'profit',
      icon: CircleDollarSign,
      rawValue: Math.abs(summary?.netProfit ?? 0),
    },
    {
      label: 'Zameen Records',
      value: summary ? summary.zameenCount.toLocaleString() : 'Loading...',
      hint: 'Managed land entries',
      tone: 'land',
      icon: LandPlot,
      rawValue: summary?.zameenCount ?? 0,
    },
    {
      label: 'Crop Records',
      value: summary ? summary.cropCount.toLocaleString() : 'Loading...',
      hint: 'Active and historical crops',
      tone: 'crop',
      icon: Wheat,
      rawValue: summary?.cropCount ?? 0,
    },
    {
      label: 'Transactions',
      value: summary ? transactionCount.toLocaleString() : 'Loading...',
      hint: 'Expense and income entries',
      tone: 'activity',
      icon: ChartNoAxesCombined,
      rawValue: transactionCount,
    },
  ];

  useEffect(() => {
    async function loadDashboard() {
      try {
        setSummary(await getReportSummary());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard.');
      }
    }

    void loadDashboard();
  }, []);

  return (
    <>
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Live farm control</p>
          <h1>
            Welcome back, <span>{currentUser.firstName}</span>
          </h1>
          <p>
            Your zameen, crops, spending, income, and profit are gathered into
            one working view.
          </p>
          <div className="dashboard-hero-tags">
            <span>
              <ShieldCheck size={15} aria-hidden="true" />
              {currentUser.role === 'ADMIN' ? 'Admin access' : 'User access'}
            </span>
            <span>
              <Sprout size={15} aria-hidden="true" />
              {currentUser.farmerType ?? 'Farmer'}
            </span>
            <span>
              <SlidersHorizontal size={15} aria-hidden="true" />
              {currentUser.preferredAreaUnit} / {currentUser.preferredCurrency}
            </span>
          </div>
        </div>

        <div className="dashboard-hero-panel" aria-hidden="true">
          <div className="live-chip">Live ledger</div>
          <div className="profit-orbit">
            <strong>{summary ? `${profitMargin}%` : '--'}</strong>
            <span>profit margin</span>
          </div>
          <div className="hero-market-lines">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="metric-grid">
        {metricCards.map((card) => (
          <article
            className={`metric-card metric-card-${card.tone}`}
            key={card.label}
            style={metricStyle(card.rawValue, maxMoneyValue || transactionCount)}
          >
            <div className="metric-card-header">
              <span>{card.label}</span>
              <card.icon size={20} aria-hidden="true" />
            </div>
            <strong>{card.value}</strong>
            <p>{card.hint}</p>
            <div className="metric-level" aria-hidden="true" />
          </article>
        ))}
      </section>

      <section className="dashboard-insights">
        <article className="panel cashflow-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Cash Flow</p>
              <h2>Profit movement</h2>
            </div>
          </div>

          <div className="cashflow-bars" aria-label="Cash flow comparison">
            <div className="cashflow-row">
              <span>
                <ArrowDownRight size={16} aria-hidden="true" />
                Expense
              </span>
              <div className="cashflow-track">
                <i
                  className="cashflow-fill expense-fill"
                  style={metricStyle(summary?.totalExpense ?? 0, maxMoneyValue)}
                />
              </div>
              <strong>{summary ? formatCurrency(summary.totalExpense) : 'Loading...'}</strong>
            </div>
            <div className="cashflow-row">
              <span>
                <ArrowUpRight size={16} aria-hidden="true" />
                Income
              </span>
              <div className="cashflow-track">
                <i
                  className="cashflow-fill income-fill"
                  style={metricStyle(summary?.totalIncome ?? 0, maxMoneyValue)}
                />
              </div>
              <strong>{summary ? formatCurrency(summary.totalIncome) : 'Loading...'}</strong>
            </div>
            <div className="cashflow-row">
              <span>
                <CircleDollarSign size={16} aria-hidden="true" />
                Net
              </span>
              <div className="cashflow-track">
                <i
                  className="cashflow-fill profit-fill"
                  style={metricStyle(Math.abs(summary?.netProfit ?? 0), maxMoneyValue)}
                />
              </div>
              <strong>{summary ? formatCurrency(summary.netProfit) : 'Loading...'}</strong>
            </div>
          </div>
        </article>

        <article className="field-image-panel">
          <div>
            <p className="eyebrow">Field View</p>
            <h2>Records become decisions when the picture is clear.</h2>
          </div>
          <span>{summary?.cropCount ?? 0} crops tracked</span>
        </article>
      </section>

    </>
  );
}
