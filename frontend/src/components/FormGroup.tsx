import React from 'react';
import './FormGroup.css';

interface FormGroupProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

const FormGroup: React.FC<FormGroupProps> = ({
  id,
  label,
  error,
  required = false,
  className = '',
  children
}) => {
  return (
    <div className={`form-group ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="required-mark">*</span>}
      </label>
      {children}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
};

export default FormGroup; 