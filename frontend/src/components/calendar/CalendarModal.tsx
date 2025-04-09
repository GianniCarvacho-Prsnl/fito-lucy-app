import React, { useState, useEffect } from 'react';
import { PetEvent, Pet } from '../../services/calendarService';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: PetEvent;
  onSave: (event: PetEvent) => void;
  onDelete: (eventId: string) => void;
  pets: Pet[];
  eventColor: string;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ 
  isOpen, 
  onClose, 
  event, 
  onSave, 
  onDelete, 
  pets,
  eventColor 
}) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<PetEvent>(event);

  useEffect(() => {
    setFormData(event);
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Manejar específicamente el cambio de fecha/hora para forzar intervalos de 30 minutos
    if (name === 'start' && value) {
      const dateTime = new Date(value);
      const minutes = dateTime.getMinutes();
      
      // Redondear minutos al intervalo de 30 minutos más cercano (0 o 30)
      const roundedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 0;
      const hours = minutes < 15 ? dateTime.getHours() : minutes < 45 ? dateTime.getHours() : dateTime.getHours() + 1;
      
      // Si redondeamos a la siguiente hora y es medianoche, necesitamos ajustar la fecha
      if (minutes >= 45 && hours === 24) {
        dateTime.setDate(dateTime.getDate() + 1);
        dateTime.setHours(0);
      } else {
        dateTime.setHours(hours);
      }
      
      dateTime.setMinutes(roundedMinutes);
      dateTime.setSeconds(0);
      dateTime.setMilliseconds(0);
      
      // Formato ISO para el input datetime-local
      const roundedValue = dateTime.toISOString().slice(0, 16);
      setFormData(prev => ({ ...prev, [name]: roundedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Asegurarnos de que las fechas se guardan en UTC sin convertir a zona horaria local
    const startDateTime = new Date(formData.start);
    // Creamos fechas UTC
    const startISO = new Date(
      Date.UTC(
        startDateTime.getFullYear(),
        startDateTime.getMonth(),
        startDateTime.getDate(),
        startDateTime.getHours(),
        startDateTime.getMinutes()
      )
    ).toISOString();
    
    // Calcular la fecha de fin (30 minutos después del inicio) en UTC
    const endDateTime = new Date(startISO);
    endDateTime.setUTCMinutes(endDateTime.getUTCMinutes() + 30);
    const endISO = endDateTime.toISOString();
    
    console.log('Edición - Hora inicio (UTC):', startISO);
    console.log('Edición - Hora fin (UTC):', endISO);
    
    // Crear evento con fecha de fin calculada
    const updatedFormData = {
      ...formData,
      start: startISO,
      end: endISO
    };
    
    onSave(updatedFormData);
    setEditMode(false);
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      onDelete(event.id);
    }
  };

  if (!isOpen) return null;

  // Encontrar la mascota asociada
  const selectedPet = pets.find(p => p.id === event.pet_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-4">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">
              {editMode ? 'Editar Evento' : 'Detalle del Evento'}
            </h2>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {!editMode ? (
            <div className="space-y-4">
              <div 
                className="p-2 rounded-md" 
                style={{ backgroundColor: `${eventColor}20`, borderLeft: `4px solid ${eventColor}` }}
              >
                <h3 className="text-lg font-semibold">{event.title}</h3>
                <p className="text-gray-600">
                  {new Date(event.start).toLocaleString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'UTC'
                  })}
                  {event.end && (
                    <span> hasta {new Date(event.end).toLocaleString('es-ES', { 
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'UTC'
                    })}</span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Mascota</p>
                <p>{selectedPet?.name || 'No especificada'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Tipo de Evento</p>
                <p>{event.event_type || 'General'}</p>
              </div>

              {event.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Notas</p>
                  <p className="whitespace-pre-wrap">{event.notes}</p>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => setEditMode(true)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mascota</label>
                <select
                  name="pet_id"
                  value={formData.pet_id || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Seleccionar mascota</option>
                  {pets.map(pet => (
                    <option key={pet.id} value={pet.id}>{pet.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
                <select
                  name="event_type"
                  value={formData.event_type || 'General'}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Veterinario">Veterinario</option>
                  <option value="Medicación">Medicación</option>
                  <option value="Peluquería">Peluquería</option>
                  <option value="Vacuna">Vacuna</option>
                  <option value="Desparasitación">Desparasitación</option>
                  <option value="General">General</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora de Inicio</label>
                <input
                  type="datetime-local"
                  name="start"
                  value={formData.start ? formData.start.slice(0, 16) : ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  step="1800"
                />
                <p className="text-xs text-gray-500 mt-1">El evento durará 30 minutos a partir de esta hora</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Guardar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarModal; 