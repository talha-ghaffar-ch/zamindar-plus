import { useState } from 'react';
import type { TranslationKey } from '@zamindar/shared';
import { useI18n } from '../i18n/useT';
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
  labelKey: TranslationKey;
  detailKey: TranslationKey;
  navKey: TranslationKey;
  page: string;
  icon: LucideIcon;
}> = [
  {
    labelKey: 'help.step1',
    detailKey: 'help.step1Detail',
    navKey: 'nav.profiles',
    page: 'Profiles',
    icon: UsersRound,
  },
  {
    labelKey: 'help.step2',
    detailKey: 'help.step2Detail',
    navKey: 'nav.zameen',
    page: 'Zameen',
    icon: LandPlot,
  },
  {
    labelKey: 'help.step3',
    detailKey: 'help.step3Detail',
    navKey: 'nav.crops',
    page: 'Crops',
    icon: Wheat,
  },
  {
    labelKey: 'help.step4',
    detailKey: 'help.step4Detail',
    navKey: 'nav.expenses',
    page: 'Expenses',
    icon: ClipboardList,
  },
  {
    labelKey: 'help.step5',
    detailKey: 'help.step5Detail',
    navKey: 'nav.income',
    page: 'Income',
    icon: CircleDollarSign,
  },
  {
    labelKey: 'help.step6',
    detailKey: 'help.step6Detail',
    navKey: 'nav.reports',
    page: 'Reports',
    icon: BookOpenCheck,
  },
];

export function HelpPage({ onNavigate }: HelpPageProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<HelpTab>('guide');

  return (
    <section className="help-screen">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t('help.eyebrow')}</p>
          <h1>{t('help.title')}</h1>
        </div>
      </section>

      <section className="panel help-tabs" aria-label="Help sections">
        <button
          className={activeTab === 'guide' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('guide')}
        >
          <BookOpenCheck size={17} aria-hidden="true" />
          {t('help.tabGuide')}
        </button>
        <button
          className={activeTab === 'privacy' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('privacy')}
        >
          <ShieldCheck size={17} aria-hidden="true" />
          {t('help.tabPrivacy')}
        </button>
        <button
          className={activeTab === 'terms' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('terms')}
        >
          <FileText size={17} aria-hidden="true" />
          {t('help.tabTerms')}
        </button>
        <button
          className={activeTab === 'support' ? 'active' : ''}
          type="button"
          onClick={() => setActiveTab('support')}
        >
          <LifeBuoy size={17} aria-hidden="true" />
          {t('help.tabSupport')}
        </button>
      </section>

      {activeTab === 'guide' ? (
        <section className="help-step-grid">
          {guideSteps.map((step, index) => (
            <article className="panel help-step-card" key={step.page}>
              <div className="help-step-number">{index + 1}</div>
              <step.icon size={22} aria-hidden="true" />
              <h2>{t(step.labelKey)}</h2>
              <p>{t(step.detailKey)}</p>
              <button
                className="text-button"
                type="button"
                onClick={() => onNavigate(step.page)}
              >
                {t('help.open')} {t(step.navKey)}
              </button>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === 'privacy' ? (
        <section className="legal-grid">
          <article className="panel legal-panel">
            <p className="eyebrow">{t('help.privacyEyebrow')}</p>
            <h2>{t('help.privacyTitle')}</h2>
            <p>{t('help.privacy1')}</p>
            <p>{t('help.privacy2')}</p>
            <p>{t('help.privacy3')}</p>
          </article>

          <article className="panel legal-panel">
            <p className="eyebrow">{t('help.deletionEyebrow')}</p>
            <h2>{t('help.deletionTitle')}</h2>
            <p>{t('help.deletion1')}</p>
            <p>{t('help.deletion2')}</p>
            <div className="legal-callout">
              <Trash2 size={18} aria-hidden="true" />
              <span>{t('help.deletionCallout')}</span>
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === 'terms' ? (
        <section className="legal-grid">
          <article className="panel legal-panel">
            <p className="eyebrow">{t('help.termsEyebrow')}</p>
            <h2>{t('help.termsTitle')}</h2>
            <p>{t('help.terms1')}</p>
            <p>{t('help.terms2')}</p>
            <p>{t('help.terms3')}</p>
          </article>

          <article className="panel legal-panel">
            <p className="eyebrow">{t('help.availabilityEyebrow')}</p>
            <h2>{t('help.availabilityTitle')}</h2>
            <p>{t('help.availability1')}</p>
            <p>{t('help.availability2')}</p>
          </article>
        </section>
      ) : null}

      {activeTab === 'support' ? (
        <section className="legal-grid">
          <article className="panel legal-panel">
            <p className="eyebrow">{t('help.supportEyebrow')}</p>
            <h2>{t('help.supportTitle')}</h2>
            <p>{t('help.support1')}</p>
            <p>{t('help.support2')}</p>
          </article>

          <article className="panel legal-panel">
            <p className="eyebrow">{t('help.troubleEyebrow')}</p>
            <h2>{t('help.troubleTitle')}</h2>
            <ul className="help-check-list">
              <li>{t('help.check1')}</li>
              <li>{t('help.check2')}</li>
              <li>{t('help.check3')}</li>
              <li>{t('help.check4')}</li>
            </ul>
          </article>
        </section>
      ) : null}
    </section>
  );
}
