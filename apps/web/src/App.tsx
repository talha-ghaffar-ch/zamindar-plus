import { useState } from 'react';
import './App.css';
import { DashboardPage } from './pages/DashboardPage';

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>Zamindar Plus</strong>
          <span>Farm ledger platform</span>
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
      </aside>

      <main className="workspace">
        {activePage === 'Dashboard' ? (
          <DashboardPage />
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