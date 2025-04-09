import React from 'react';

interface TimeSelectorProps {
  value: string;
  onChange: (time: string) => void;
  className?: string;
}

/**
 * Componente selector de hora con intervalos de 30 minutos
 */
const TimeSelector: React.FC<TimeSelectorProps> = ({ value, onChange, className = '' }) => {
  // Generar opciones de horario en intervalos de 30 minutos
  const getTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      // Formato de 2 dígitos para la hora
      const formattedHour = hour.toString().padStart(2, '0');
      
      // Añadir opción para minuto 00
      options.push({
        value: `${formattedHour}:00`,
        label: `${formattedHour}:00`
      });
      
      // Añadir opción para minuto 30
      options.push({
        value: `${formattedHour}:30`,
        label: `${formattedHour}:30`
      });
    }
    return options;
  };

  const timeOptions = getTimeOptions();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`p-2 border border-gray-300 rounded-md ${className}`}
    >
      {timeOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default TimeSelector; 