import React, { useState, useEffect } from 'react';
import { CalendarEvent, Pet } from '../../services/calendarService';

interface EventFormProps {
  pets: Pet[];
  event?: CalendarEvent;
  onSubmit: (eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'mascota'>) => void;
  onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ pets, event, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Omit<CalendarEvent, 'id' | 'created_at' | 'mascota'>>({
    user_id: '',
    mascota_id: '',
    fecha_hora_inicio: '',
    fecha_hora_fin: null,
    titulo: '',
    tipo_evento: 'Veterinario',
    notas: ''
  });

  useEffect(() => {
    if (event) {
      // Si event existe, estamos editando un evento existente
      setFormData({
        user_id: event.user_id,
        mascota_id: event.mascota_id,
        fecha_hora_inicio: event.fecha_hora_inicio.substring(0, 16), // formato YYYY-MM-DDTHH:MM
        fecha_hora_fin: event.fecha_hora_fin ? event.fecha_hora_fin.substring(0, 16) : null,
        titulo: event.titulo,
        tipo_evento: event.tipo_evento,
        notas: event.notas || ''
      });
    } else if (pets.length > 0) {
      // Si estamos creando un nuevo evento, preseleccionamos la primera mascota
      setFormData(prevData => ({
        ...prevData,
        mascota_id: pets[0].id
      }));
    }
  }, [event, pets]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const eventTypes = [
    'Veterinario',
    'Medicación',
    'Peluquería',
    'Vacuna',
    'Desparasitación',
    'Otro'
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full">
      <h2 className="text-xl font-bold mb-4">{event ? 'Editar Evento' : 'Nuevo Evento'}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mascota</label>
          <select
            name="mascota_id"
            value={formData.mascota_id}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Seleccionar mascota</option>
            {pets.map(pet => (
              <option key={pet.id} value={pet.id}>{pet.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
          <select
            name="tipo_evento"
            value={formData.tipo_evento}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Seleccionar tipo</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora de Inicio</label>
          <input
            type="datetime-local"
            name="fecha_hora_inicio"
            value={formData.fecha_hora_inicio}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora de Fin (opcional)</label>
          <input
            type="datetime-local"
            name="fecha_hora_fin"
            value={formData.fecha_hora_fin || ''}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
          <textarea
            name="notas"
            value={formData.notas || ''}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {event ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm; 