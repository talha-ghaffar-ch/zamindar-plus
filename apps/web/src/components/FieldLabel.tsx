type FieldLabelProps = {
  children: string;
  required?: boolean;
};

export function FieldLabel({ children, required = false }: FieldLabelProps) {
  return (
    <span className="field-label-text">
      {children}
      {required ? (
        <span aria-label="required" className="required-mark">
          *
        </span>
      ) : (
        <span className="optional-mark">Optional</span>
      )}
    </span>
  );
}
