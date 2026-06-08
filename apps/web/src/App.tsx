import { useEffect, useState } from 'react';
import './App.css';
import {
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

const navItems = [
  'Dashboard',
  'Users',
  'Profiles',
  'Zameen',
  'Crops',
  'Expenses',
  'Income',
  'Reports',
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
          <strong>Zamindar Plus</strong>
          <span>Farm ledger platform</span>
        </div>

        <div className="sidebar-user">
          <span>
            {currentUser.firstName} {currentUser.lastName}
          </span>
          <small>{currentUser.email}</small>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              className={item === activePage ? 'nav-button active' : 'nav-button'}
              key={item}
              type="button"
              onClick={() => setActivePage(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <button className="logout-button" type="button" onClick={handleLogout}>
          Sign Out
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
