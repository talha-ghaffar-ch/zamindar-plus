import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  BarChart3,
  CircleDollarSign,
  ClipboardList,
  HelpCircle,
  LandPlot,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Sprout,
  UsersRound,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import './App.css';
import {
  AUTH_EXPIRED_EVENT,
  clearAuthToken,
  getAuthToken,
  getMe,
  setAuthToken,
  type AuthResponse,
  type User,
} from './lib/api';
import type { TranslationKey } from '@zamindar/shared';
import { LOCALE_LIST, normalizeLocale } from '@zamindar/shared';
import { useI18n } from './i18n/useT';
import { ToastViewport, type ToastMessage } from './components/ToastViewport';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { SettingsPage } from './pages/SettingsPage';
import { ZameenPage } from './pages/ZameenPage';
import { CropsPage } from './pages/CropsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { IncomePage } from './pages/IncomePage';
import { ReportsPage } from './pages/ReportsPage';
import { HelpPage } from './pages/HelpPage';
import { AdminPage } from './pages/AdminPage';
import { ZamindarAiPage } from './pages/ZamindarAiPage';

const mainNavItems: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Profiles', icon: UsersRound },
  { label: 'Zameen', icon: LandPlot },
  { label: 'Crops', icon: Wheat },
  { label: 'Expenses', icon: ClipboardList },
  { label: 'Income', icon: CircleDollarSign },
  { label: 'Reports', icon: BarChart3 },
];
const helpNavItem = { label: 'Help', icon: HelpCircle };
const adminNavItem = { label: 'Admin', icon: ShieldCheck };
const settingsNavItem = { label: 'Settings', icon: Settings };

// Nav labels stay as stable routing keys; only the displayed text is localized.
const NAV_LABEL_KEYS: Record<string, TranslationKey> = {
  Dashboard: 'nav.dashboard',
  Profiles: 'nav.profiles',
  Zameen: 'nav.zameen',
  Crops: 'nav.crops',
  Expenses: 'nav.expenses',
  Income: 'nav.income',
  Reports: 'nav.reports',
  Admin: 'nav.admin',
  Help: 'nav.help',
  Settings: 'nav.settings',
};
const THEME_STORAGE_KEY = 'zamindar-plus-theme';

type ThemePreference = 'light' | 'dark';

function readStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return 'light';
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const { t, setLocale } = useI18n();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(readStoredTheme);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const applyUserLocale = useCallback(
    (user: User) => {
      // The device's saved choice wins; otherwise adopt the account's language.
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem('zamindar-plus-locale');
        if (stored) {
          return;
        }
      }
      setLocale(normalizeLocale(user.preferredLanguage));
    },
    [setLocale],
  );

  const showToast = useCallback((message: string) => {
    setToasts((currentToasts) => [
      ...currentToasts,
      {
        id: Date.now() + Math.random(),
        message,
      },
    ]);
  }, []);

  const closeToast = useCallback((id: number) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    );
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    let isActive = true;

    async function restoreSession() {
      if (!getAuthToken()) {
        setIsCheckingSession(false);
        return;
      }

      try {
        const user = await getMe();

        if (isActive) {
          setCurrentUser(user);
          applyUserLocale(user);
        }
      } catch {
        clearAuthToken();
      } finally {
        if (isActive) {
          setIsCheckingSession(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isActive = false;
    };
  }, [applyUserLocale]);

  useEffect(() => {
    function handleAuthExpired() {
      setCurrentUser(null);
      setActivePage('Dashboard');
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  function handleAuthenticated(authResponse: AuthResponse) {
    setAuthToken(authResponse.accessToken);
    setCurrentUser(authResponse.user);
    applyUserLocale(authResponse.user);
    setActivePage('Dashboard');
    showToast(t('common.loginSuccess'));
  }

  function handleLogout() {
    clearAuthToken();
    setCurrentUser(null);
    setActivePage('Dashboard');
    showToast(t('common.signedOut'));
  }

  function handleAccountDeleted() {
    clearAuthToken();
    setCurrentUser(null);
    setActivePage('Dashboard');
    showToast(t('common.accountDeleted'));
  }

  const toastViewport = <ToastViewport toasts={toasts} onClose={closeToast} />;
  const globalLanguageToggle = <GlobalLanguageToggle />;

  function renderActivePage(user: User) {
    if (activePage === 'Dashboard') {
      return <DashboardPage currentUser={user} onNavigate={setActivePage} />;
    }

    if (activePage === 'Settings') {
      return (
        <SettingsPage
          currentUser={user}
          theme={theme}
          onAccountDeleted={handleAccountDeleted}
          onNotify={showToast}
          onThemeChange={setTheme}
          onUserUpdated={setCurrentUser}
        />
      );
    }

    if (activePage === 'Profiles') {
      return <ProfilesPage onNotify={showToast} />;
    }

    if (activePage === 'Zameen') {
      return <ZameenPage onNotify={showToast} />;
    }

    if (activePage === 'Crops') {
      return <CropsPage onNotify={showToast} />;
    }

    if (activePage === 'Expenses') {
      return <ExpensesPage onNotify={showToast} />;
    }

    if (activePage === 'Income') {
      return <IncomePage onNotify={showToast} />;
    }

    if (activePage === 'Reports') {
      return <ReportsPage onNotify={showToast} />;
    }

    if (activePage === 'Zamindar AI') {
      return <ZamindarAiPage onNavigate={setActivePage} />;
    }

    if (activePage === 'Admin') {
      return <AdminPage currentUser={user} onNotify={showToast} />;
    }

    if (activePage === 'Help') {
      return <HelpPage onNavigate={setActivePage} />;
    }

    return (
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('nav.workspace')}</p>
          <h1>{t('nav.sectionUnavailable')}</h1>
        </div>
        <p className="muted">{t('nav.chooseSection')}</p>
      </section>
    );
  }

  if (isCheckingSession) {
    return (
      <MotionConfig reducedMotion="user">
        {globalLanguageToggle}
        <motion.main
          animate={{ opacity: 1 }}
          className="auth-screen"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <section className="auth-panel">
            <div className="loading-mark" aria-hidden="true">
              <Sprout size={28} />
            </div>
            <p className="eyebrow">{t('common.appName')}</p>
            <h1>{t('nav.openingWorkspace')}</h1>
          </section>
        </motion.main>
        {toastViewport}
      </MotionConfig>
    );
  }

  if (!currentUser) {
    return (
      <MotionConfig reducedMotion="user">
        {globalLanguageToggle}
        <motion.div
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <AuthPage onAuthenticated={handleAuthenticated} onNotify={showToast} />
        </motion.div>
        {toastViewport}
      </MotionConfig>
    );
  }

  const visibleNavItems =
    currentUser.role === 'ADMIN'
      ? [...mainNavItems, adminNavItem, helpNavItem, settingsNavItem]
      : [...mainNavItems, helpNavItem, settingsNavItem];

  return (
    <MotionConfig reducedMotion="user">
    {globalLanguageToggle}
    <div className={isSidebarCollapsed ? 'app-shell sidebar-collapsed' : 'app-shell'}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <Sprout size={24} />
          </div>
          <div className="brand-copy">
            <strong>{t('common.appName')}</strong>
            <span>{t('common.tagline')}</span>
          </div>
          <button
            aria-label={
              isSidebarCollapsed ? t('nav.openSidebar') : t('nav.closeSidebar')
            }
            className="sidebar-toggle"
            type="button"
            onClick={() => setIsSidebarCollapsed((isCollapsed) => !isCollapsed)}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen size={18} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={18} aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar" aria-hidden="true">
            {currentUser.profileImageUrl ? (
              <img alt="" src={currentUser.profileImageUrl} />
            ) : (
              currentUser.firstName.slice(0, 1)
            )}
          </div>
          <span>
            {currentUser.firstName} {currentUser.lastName}
          </span>
        </div>

        <nav className="nav-list">
          {visibleNavItems.map((item) => (
            <button
              aria-label={t(NAV_LABEL_KEYS[item.label])}
              className={item.label === activePage ? 'nav-button active' : 'nav-button'}
              key={item.label}
              type="button"
              onClick={() => setActivePage(item.label)}
            >
              <item.icon size={18} aria-hidden="true" />
              <span>{t(NAV_LABEL_KEYS[item.label])}</span>
            </button>
          ))}
        </nav>

        <button className="logout-button" type="button" onClick={handleLogout}>
          <LogOut size={18} aria-hidden="true" />
          <span>{t('nav.signOut')}</span>
        </button>
      </aside>

      <main className="workspace">
        <PageTransition pageKey={activePage}>
          {renderActivePage(currentUser)}
        </PageTransition>
      </main>
      {toastViewport}
    </div>
    </MotionConfig>
  );
}

function PageTransition({
  children,
  pageKey,
}: {
  children: ReactNode;
  pageKey: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        className="page-motion"
        exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
        initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
        key={pageKey}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function GlobalLanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      aria-label={t('language.title')}
      className="global-language-toggle"
      role="group"
    >
      {LOCALE_LIST.map((meta) => (
        <button
          aria-pressed={meta.code === locale}
          className={
            meta.code === locale
              ? 'global-language-option active'
              : 'global-language-option'
          }
          key={meta.code}
          lang={meta.htmlLang}
          title={meta.label}
          type="button"
          onClick={() => setLocale(meta.code)}
        >
          {meta.shortLabel}
        </button>
      ))}
    </div>
  );
}

export default App;
