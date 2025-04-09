import React, { useState, useEffect } from 'react';
import { PetEvent, Pet } from '../../services/calendarService';

interface NewCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: PetEvent) => void;
  pets: Pet[];
  selectedPetId: string | null;
  selectedDate?: string;
}

const NewCalendarModal: React.FC<NewCalendarModalProps> = ({
  isOpen,
  onClose,
  onSave,
  pets,
  selectedPetId,
  selectedDate
}) => {
  const [formData, setFormData] = useState<Partial<PetEvent>>({
    title: '',
    pet_id: selectedPetId || '',
    event_type: 'General',
    start: selectedDate || new Date().toISOString().slice(0, 16),
    notes: '',
    allDay: false
  });

  // Actualizar el pet_id cuando cambia el selectedPetId
  useEffect(() => {
    if (selectedPetId) {
      setFormData(prev => ({ ...prev, pet_id: selectedPetId }));
    }
  }, [selectedPetId]);

  // Actualizar la fecha de inicio cuando cambia selectedDate
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, start: selectedDate }));
    }
  }, [selectedDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Manejar checkbox para el campo allDay
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } 
    // Manejar específicamente el cambio de fecha/hora para forzar intervalos de 30 minutos
    else if (name === 'start' && value) {
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
    } 
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar si el formulario está completo
    if (!formData.title || !formData.pet_id || !formData.start) {
      alert('Por favor completa los campos requeridos');
      return;
    }
    
    // Obtener el color de la mascota seleccionada
    const selectedPet = pets.find(pet => pet.id === formData.pet_id);
    const petColor = selectedPet?.associated_color || '#3788d8';
    
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
    
    // Calcular la fecha de fin (30 minutos después del inicio)
    // También en UTC
    const endDateTime = new Date(startISO);
    
    // Si es todo el día, el evento dura todo el día
    if (formData.allDay) {
      endDateTime.setUTCHours(23, 59, 59);
    } else {
      // Si no es todo el día, dura 30 minutos
      endDateTime.setUTCMinutes(endDateTime.getUTCMinutes() + 30);
    }
    
    const endISO = endDateTime.toISOString();
    
    console.log('Hora inicio (UTC):', startISO);
    console.log('Hora fin (UTC):', endISO);
    
    // Asegurar que las fechas estén en formato ISO 
    const formattedEvent: PetEvent = {
      ...formData,
      id: `temp-${Date.now()}`, // ID temporal que será reemplazado por el backend
      pet_color: petColor,
      backgroundColor: petColor,
      borderColor: petColor,
      pet_name: selectedPet?.name,
      start: startISO,
      end: endISO
    } as PetEvent;
    
    console.log("Enviando evento para guardar:", formattedEvent);
    
    onSave(formattedEvent);
    
    // Resetear formulario después de enviar
    setFormData({
      title: '',
      pet_id: selectedPetId || '',
      event_type: 'General',
      start: selectedDate || new Date().toISOString().slice(0, 16),
      notes: '',
      allDay: false
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-4">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">Nuevo Evento</h2>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Título del evento"
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

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="allDay"
                name="allDay"
                checked={formData.allDay}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allDay" className="ml-2 block text-sm text-gray-700">
                Todo el día
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora de Inicio</label>
              <input
                type="datetime-local"
                name="start"
                value={formData.start || ''}
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
                placeholder="Agrega notas o detalles adicionales"
              ></textarea>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
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
        </div>
      </div>
    </div>
  );
};

export default NewCalendarModal; 