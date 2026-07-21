import { useI18n } from '../i18n/useT';

type FieldLabelProps = {
  children: string;
  required?: boolean;
};

export function FieldLabel({ children, required = false }: FieldLabelProps) {
  const { t } = useI18n();

  return (
    <span className="field-label-text">
      {children}
      {required ? null : (
        <span className="optional-mark">{t('common.optional')}</span>
      )}
    </span>
  );
}
