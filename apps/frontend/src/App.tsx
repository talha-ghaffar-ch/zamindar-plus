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
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Sprout,
  Sun,
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

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(readStoredTheme);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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
  }, []);

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
    setActivePage('Dashboard');
    showToast('Account login successful');
  }

  function handleLogout() {
    clearAuthToken();
    setCurrentUser(null);
    setActivePage('Dashboard');
    showToast('Signed out successfully');
  }

  function handleAccountDeleted() {
    clearAuthToken();
    setCurrentUser(null);
    setActivePage('Dashboard');
    showToast('Account deleted successfully');
  }

  const toastViewport = <ToastViewport toasts={toasts} onClose={closeToast} />;
  const globalThemeToggle = (
    <ThemeToggle
      theme={theme}
      onToggle={() =>
        setTheme((currentTheme) =>
          currentTheme === 'light' ? 'dark' : 'light',
        )
      }
    />
  );

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
      return <ZamindarAiPage />;
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
          <p className="eyebrow">Workspace</p>
          <h1>Section unavailable</h1>
        </div>
        <p className="muted">Choose a section from the sidebar.</p>
      </section>
    );
  }

  if (isCheckingSession) {
    return (
      <MotionConfig reducedMotion="user">
        {globalThemeToggle}
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
            <p className="eyebrow">Zamindar Plus</p>
            <h1>Opening workspace...</h1>
          </section>
        </motion.main>
        {toastViewport}
      </MotionConfig>
    );
  }

  if (!currentUser) {
    return (
      <MotionConfig reducedMotion="user">
        {globalThemeToggle}
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
    {globalThemeToggle}
    <div className={isSidebarCollapsed ? 'app-shell sidebar-collapsed' : 'app-shell'}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <Sprout size={24} />
          </div>
          <div className="brand-copy">
            <strong>Zamindar Plus</strong>
            <span>Farm ledger platform</span>
          </div>
          <button
            aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
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
              aria-label={item.label}
              className={item.label === activePage ? 'nav-button active' : 'nav-button'}
              key={item.label}
              type="button"
              onClick={() => setActivePage(item.label)}
            >
              <item.icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="logout-button" type="button" onClick={handleLogout}>
          <LogOut size={18} aria-hidden="true" />
          <span>Sign out</span>
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

function ThemeToggle({
  onToggle,
  theme,
}: {
  onToggle: () => void;
  theme: ThemePreference;
}) {
  const isDark = theme === 'dark';

  return (
    <button
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      className="global-theme-toggle"
      type="button"
      onClick={onToggle}
    >
      <span className="global-theme-toggle-track" aria-hidden="true">
        <Sun className="global-theme-toggle-icon sun" size={13} />
        <Moon className="global-theme-toggle-icon moon" size={13} />
        <span className="global-theme-toggle-thumb" />
      </span>
    </button>
  );
}

export default App;
