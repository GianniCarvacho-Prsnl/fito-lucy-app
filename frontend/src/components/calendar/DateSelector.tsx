import React from 'react';

interface DateSelectorProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
}

/**
 * Componente selector de fecha (sin hora)
 */
const DateSelector: React.FC<DateSelectorProps> = ({ value, onChange, className = '' }) => {
  return (
    <input
      type="date"
      value={value.split('T')[0]} // Extraer solo la parte de la fecha
      onChange={(e) => onChange(e.target.value)}
      className={`p-2 border border-gray-300 rounded-md ${className}`}
    />
  );
};

export default DateSelector; 