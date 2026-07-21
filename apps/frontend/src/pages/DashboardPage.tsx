import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  BarChart3,
  Bot,
  CircleDollarSign,
  ClipboardList,
  Gauge,
  LandPlot,
  LineChart,
  PlusCircle,
  ReceiptText,
  Route,
  Sprout,
  Wheat,
} from 'lucide-react';
import { useI18n } from '../i18n/useT';
import {
  getMonthlySummaryReport,
  getReportSummary,
  type MonthlySummaryReport,
  type ReportSummary,
  type User,
} from '../lib/api';

type DashboardPageProps = {
  currentUser: User;
  onNavigate: (page: string) => void;
};

type MetricTone = 'expense' | 'income' | 'profit' | 'land' | 'crop' | 'activity';

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
  const { t, format } = useI18n();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [monthlyReports, setMonthlyReports] = useState<MonthlySummaryReport[]>([]);
  const [error, setError] = useState('');

  const formatCurrency = (value: number) => format.currency(value);
  const formatMonth = (report: MonthlySummaryReport) =>
    format.date(new Date(Date.UTC(report.year, report.month - 1, 1)), {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });

  useEffect(() => {
    let isActive = true;

    Promise.all([getReportSummary(), getMonthlySummaryReport()])
      .then(([summaryData, monthlyData]) => {
        if (!isActive) return;

        setSummary(summaryData);
        setMonthlyReports(monthlyData);
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
  const recentMonths = monthlyReports.slice(0, 6).reverse();
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
      label: t('dashboard.expense'),
      value: summary ? formatCurrency(summary.totalExpense) : t('common.loading'),
      hint: t('dashboard.ofMovement', { percent: expenseShare }),
      tone: 'expense',
      icon: BanknoteArrowDown,
      rawValue: summary?.totalExpense ?? 0,
    },
    {
      label: t('dashboard.income'),
      value: summary ? formatCurrency(summary.totalIncome) : t('common.loading'),
      hint: t('dashboard.receivedRecorded'),
      tone: 'income',
      icon: BanknoteArrowUp,
      rawValue: summary?.totalIncome ?? 0,
    },
    {
      label: t('dashboard.netProfit'),
      value: summary ? formatCurrency(summary.netProfit) : t('common.loading'),
      hint: t('dashboard.margin', { percent: profitMargin }),
      tone: 'profit',
      icon: CircleDollarSign,
      rawValue: Math.abs(summary?.netProfit ?? 0),
    },
    {
      label: t('dashboard.zameen'),
      value: summary ? format.number(summary.zameenCount) : t('common.loading'),
      hint: t('dashboard.managedRecords'),
      tone: 'land',
      icon: LandPlot,
      rawValue: summary?.zameenCount ?? 0,
    },
    {
      label: t('dashboard.crops'),
      value: summary ? format.number(summary.cropCount) : t('common.loading'),
      hint: t('dashboard.cropCycles'),
      tone: 'crop',
      icon: Wheat,
      rawValue: summary?.cropCount ?? 0,
    },
    {
      label: t('dashboard.entries'),
      value: summary ? format.number(transactionCount) : t('common.loading'),
      hint: t('dashboard.expensePlusIncome'),
      tone: 'activity',
      icon: ClipboardList,
      rawValue: transactionCount,
    },
  ];

  const quickActions = [
    {
      label: t('dashboard.addProfile'),
      page: 'Profiles',
      icon: PlusCircle,
      hint: t('dashboard.profileHint'),
    },
    {
      label: t('dashboard.addZameen'),
      page: 'Zameen',
      icon: LandPlot,
      hint: t('dashboard.zameenHint'),
    },
    {
      label: t('dashboard.addCrop'),
      page: 'Crops',
      icon: Wheat,
      hint: t('dashboard.cropHint'),
    },
    {
      label: t('dashboard.addExpense'),
      page: 'Expenses',
      icon: ReceiptText,
      hint: t('dashboard.expenseHint'),
    },
    {
      label: t('dashboard.addIncome'),
      page: 'Income',
      icon: CircleDollarSign,
      hint: t('dashboard.incomeHint'),
    },
    {
      label: t('dashboard.openReports'),
      page: 'Reports',
      icon: BarChart3,
      hint: t('dashboard.reportsHint'),
    },
  ];

  return (
    <section className="dashboard-screen">
      <div className="dashboard-titlebar">
        <div>
          <p className="eyebrow">{t('dashboard.eyebrow')}</p>
          <h1>{t('dashboard.title')}</h1>
        </div>
        <div className="dashboard-user-chip">
          <Sprout size={16} aria-hidden="true" />
          <span>{currentUser.farmerType ?? t('dashboard.farmer')}</span>
          <strong>{currentUser.preferredAreaUnit} / {currentUser.preferredCurrency}</strong>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="dashboard-grid">
        <section className="panel dashboard-profit-panel">
          <div className="panel-header compact-panel-header">
            <div>
              <p className="eyebrow">{t('dashboard.financialPulse')}</p>
              <h2>{summary ? formatCurrency(summary.netProfit) : t('common.loading')}</h2>
            </div>
            <Gauge size={22} aria-hidden="true" />
          </div>

          <div className="profit-ring" style={ringStyle(profitMargin)}>
            <strong>{summary ? `${profitMargin}%` : '--'}</strong>
            <span>{t('dashboard.profitMargin')}</span>
          </div>

          <div className="cash-mini-list">
            <div>
              <span>
                <ArrowDownRight size={15} aria-hidden="true" />
                {t('dashboard.expense')}
              </span>
              <b>{summary ? formatCurrency(summary.totalExpense) : t('common.loading')}</b>
            </div>
            <div>
              <span>
                <ArrowUpRight size={15} aria-hidden="true" />
                {t('dashboard.income')}
              </span>
              <b>{summary ? formatCurrency(summary.totalIncome) : t('common.loading')}</b>
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
              <p className="eyebrow">{t('dashboard.fastWork')}</p>
              <h2>{t('dashboard.directActions')}</h2>
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
              <p className="eyebrow">{t('dashboard.monthlyMovement')}</p>
              <h2>{recentMonths.length ? t('dashboard.monthTrend', { count: recentMonths.length }) : t('dashboard.noMonthlyData')}</h2>
            </div>
            <div className="chart-legend">
              <span className="legend-income">{t('dashboard.legendIncome')}</span>
              <span className="legend-expense">{t('dashboard.legendExpense')}</span>
              <span className="legend-profit">{t('dashboard.legendNet')}</span>
            </div>
          </div>

          <div className="monthly-chart-wrap">
            <div className="chart-caption">
              <LineChart size={16} aria-hidden="true" />
              <span>{t('dashboard.chartCaption')}</span>
            </div>
            <div className="monthly-chart" aria-label={t('dashboard.chartAria')}>
            {recentMonths.length === 0 ? (
              <p className="muted">{t('dashboard.monthlyEmpty')}</p>
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
          </div>
        </section>

        <button
          className="panel dashboard-ai-panel dashboard-ai-launch"
          type="button"
          onClick={() => onNavigate('Zamindar AI')}
        >
          <div className="dashboard-ai-orb" aria-hidden="true">
            <Bot size={34} />
          </div>
          <strong>{t('dashboard.aiName')}</strong>
        </button>
      </div>
    </section>
  );
}
