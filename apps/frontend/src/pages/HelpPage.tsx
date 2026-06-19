import { useState } from 'react';
import {
  BookOpenCheck,
  CircleDollarSign,
  ClipboardList,
  FileText,
  LandPlot,
  LifeBuoy,
  ShieldCheck,
  Trash2,
  UsersRound,
  Wheat,
  type LucideIcon,
} from 'lucide-react';

type HelpTab = 'guide' | 'privacy' | 'terms' | 'support';

type HelpPageProps = {
  onNavigate: (page: string) => void;
};

const guideSteps: Array<{
  label: string;
  detail: string;
  page: string;
  icon: LucideIcon;
}> = [
  {
    label: 'Create a profile',
    detail: 'Start with the farm owner, family book, or management profile.',
    page: 'Profiles',
    icon: UsersRound,
  },
  {
    label: 'Add zameen',
    detail: 'Attach land records, area, ownership, killa, murabba, and khasra details.',
    page: 'Zameen',
    icon: LandPlot,
  },
  {
    label: 'Add crops',
    detail: 'Create crop cycles under each zameen and track active or completed crops.',
    page: 'Crops',
    icon: Wheat,
  },
  {
    label: 'Record expenses',
    detail: 'Enter kharcha by crop so cost and profit reports stay accurate.',
    page: 'Expenses',
    icon: ClipboardList,
  },
  {
    label: 'Record income',
    detail: 'Save crop sales, buyer names, rates, quantities, and payment status.',
    page: 'Income',
    icon: CircleDollarSign,
  },
  {
    label: 'Review reports',
    detail: 'Use crop, status, year, and month filters to understand profit movement.',
    page: 'Reports',
    icon: BookOpenCheck,
  },
];

export function HelpPage({ onNavigate }: HelpPageProps) {
  const [activeTab, setActiveTab] = useState<HelpTab>('guide');

  return (
    <section className="help-screen">
      <section className="page-header">
        <div>
          <p className="eyebrow">Help</p>
          <h1>Guide and policies</h1>
        </div>
      </section>

      <section className="panel help-tabs" aria-label="Help sections">
        <button
          className={activeTab === 'guide' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('guide')}
        >
          <BookOpenCheck size={17} aria-hidden="true" />
          Getting started
        </button>
        <button
          className={activeTab === 'privacy' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('privacy')}
        >
          <ShieldCheck size={17} aria-hidden="true" />
          Privacy
        </button>
        <button
          className={activeTab === 'terms' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('terms')}
        >
          <FileText size={17} aria-hidden="true" />
          Terms
        </button>
        <button
          className={activeTab === 'support' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('support')}
        >
          <LifeBuoy size={17} aria-hidden="true" />
          Support
        </button>
      </section>

      {activeTab === 'guide' ? (
        <section className="help-step-grid">
          {guideSteps.map((step, index) => (
            <article className="panel help-step-card" key={step.label}>
              <div className="help-step-number">{index + 1}</div>
              <step.icon size={22} aria-hidden="true" />
              <h2>{step.label}</h2>
              <p>{step.detail}</p>
              <button
                className="text-button"
                type="button"
                onClick={() => onNavigate(step.page)}
              >
                Open {step.page}
              </button>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === 'privacy' ? (
        <section className="legal-grid">
          <article className="panel legal-panel">
            <p className="eyebrow">Privacy policy</p>
            <h2>How data is handled</h2>
            <p>
              Zamindar Plus stores account information, profile records, land
              records, crop cycles, expenses, income, settings, and reports so
              the farm ledger can work across sessions and devices.
            </p>
            <p>
              Passwords are stored as secure hashes. Email verification and
              password reset links use temporary tokens, and only hashed token
              values are kept in the database.
            </p>
            <p>
              Farm records belong to the authenticated account. The app should
              only share data with service providers needed for hosting,
              database, email delivery, backups, monitoring, and security.
            </p>
          </article>

          <article className="panel legal-panel">
            <p className="eyebrow">Data deletion</p>
            <h2>Deleting an account</h2>
            <p>
              Users can delete their account from Settings. Deleting an account
              removes the user and related profiles, zameen, crops, expenses,
              income, and reports from the active database.
            </p>
            <p>
              Backup copies may remain for a limited retention period depending
              on the database backup policy, then expire according to the backup
              lifecycle.
            </p>
            <div className="legal-callout">
              <Trash2 size={18} aria-hidden="true" />
              <span>Account deletion is permanent after backup retention expires.</span>
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === 'terms' ? (
        <section className="legal-grid">
          <article className="panel legal-panel">
            <p className="eyebrow">Terms of use</p>
            <h2>User responsibilities</h2>
            <p>
              Users are responsible for entering accurate farm, crop, expense,
              income, and account information. Reports are only as accurate as
              the records entered into the system.
            </p>
            <p>
              Zamindar Plus is a record-keeping and reporting tool. It does not
              replace legal, tax, agricultural, accounting, or financial advice.
            </p>
            <p>
              Users must protect their login credentials and should only use the
              system for lawful farm management and ledger activity.
            </p>
          </article>

          <article className="panel legal-panel">
            <p className="eyebrow">Availability</p>
            <h2>Service limits</h2>
            <p>
              Hosting, internet connectivity, email delivery, database services,
              and third-party providers may affect availability. Maintenance and
              updates may occasionally interrupt access.
            </p>
            <p>
              Before public launch, the final owner should publish the legal
              business name, support email, privacy contact, and backup
              retention period.
            </p>
          </article>
        </section>
      ) : null}

      {activeTab === 'support' ? (
        <section className="legal-grid">
          <article className="panel legal-panel">
            <p className="eyebrow">Support</p>
            <h2>Getting help</h2>
            <p>
              For account access issues, users should first try password reset,
              then contact the project owner with their registered email
              address and a short description of the issue.
            </p>
            <p>
              For incorrect reports, check that each crop has the right zameen,
              expenses are recorded under the correct crop, and income entries
              include the correct total amount and date.
            </p>
          </article>

          <article className="panel legal-panel">
            <p className="eyebrow">Troubleshooting</p>
            <h2>Common checks</h2>
            <ul className="help-check-list">
              <li>Create records in this order: profile, zameen, crop, expense or income.</li>
              <li>Use the Reports filters when comparing one crop or season.</li>
              <li>Verify your email before trying to sign in after registration.</li>
              <li>Use password reset if a password is forgotten.</li>
            </ul>
          </article>
        </section>
      ) : null}
    </section>
  );
}
