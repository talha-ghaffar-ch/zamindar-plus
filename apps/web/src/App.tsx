import { useEffect, useState } from 'react';
import {
  BarChart3,
  CircleDollarSign,
  ClipboardList,
  LandPlot,
  LayoutDashboard,
  LogOut,
  Sprout,
  UserRound,
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
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { UsersPage } from './pages/UsersPage';
import { ZameenPage } from './pages/ZameenPage';
import { CropsPage } from './pages/CropsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { IncomePage } from './pages/IncomePage';
import { ReportsPage } from './pages/ReportsPage';

const navItems: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Users', icon: UserRound },
  { label: 'Profiles', icon: UsersRound },
  { label: 'Zameen', icon: LandPlot },
  { label: 'Crops', icon: Wheat },
  { label: 'Expenses', icon: ClipboardList },
  { label: 'Income', icon: CircleDollarSign },
  { label: 'Reports', icon: BarChart3 },
];

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

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
  }

  function handleLogout() {
    clearAuthToken();
    setCurrentUser(null);
    setActivePage('Dashboard');
  }

  if (isCheckingSession) {
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <div className="loading-mark" aria-hidden="true">
            <Sprout size={28} />
          </div>
          <p className="eyebrow">Zamindar Plus</p>
          <h1>Opening workspace...</h1>
        </section>
      </main>
    );
  }

  if (!currentUser) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <Sprout size={24} />
          </div>
          <div>
            <strong>Zamindar Plus</strong>
            <span>Farm ledger platform</span>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar" aria-hidden="true">
            {currentUser.firstName.slice(0, 1)}
          </div>
          <span>
            {currentUser.firstName} {currentUser.lastName}
          </span>
          <small>{currentUser.email}</small>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
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
          <span>Sign Out</span>
        </button>
      </aside>

      <main className="workspace">
        {activePage === 'Dashboard' ? (
          <DashboardPage />
        ) : activePage === 'Users' ? (
          <UsersPage
            currentUser={currentUser}
            onAccountDeleted={handleLogout}
            onUserUpdated={setCurrentUser}
          />
        ) : activePage === 'Profiles' ? (
          <ProfilesPage />
        ) : activePage === 'Zameen' ? (
          <ZameenPage />
        ) : activePage === 'Crops' ? (
          <CropsPage />
        ) : activePage === 'Expenses' ? (
          <ExpensesPage />
        ) : activePage === 'Income' ? (
          <IncomePage />
        ) : activePage === 'Reports' ? (
          <ReportsPage />
        ) : (
          <section className="page-header">
            <div>
              <p className="eyebrow">{activePage}</p>
              <h1>{activePage}</h1>
            </div>
            <p className="muted">This screen will be built next.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
