import React, { useState, useEffect } from 'react';
import Calendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
// Comentamos temporalmente la importación del locale
// import esLocale from '@fullcalendar/core/locales/es';
import moment from 'moment';
// Establecer locale español directamente sin importar archivo adicional
moment.locale('es');
import CalendarModal from '../components/calendar/CalendarModal';
import NewCalendarModal from '../components/calendar/NewCalendarModal';
import PetCards from '../components/calendar/PetCards';
import {
  calendarService,
  PetEvent,
  Pet,
  CalendarView,
} from '../services/calendarService';
import './CalendarPage.css';
import Layout from '../components/Layout';

function CalendarPage() {
  const [events, setEvents] = useState<PetEvent[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PetEvent | null>(null);
  const [selectedEventColor, setSelectedEventColor] = useState<string>('#3788d8');
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Función auxiliar para formatear las fechas de los eventos
  const formatEvents = (events: PetEvent[]) => {
    return events.map(event => ({
      ...event,
      start: event.start,
      end: event.end
    }));
  };

  const fetchEvents = async () => {
    try {
      // Obtener eventos para todos o para una mascota específica
      const eventsData = await (selectedPetId
        ? calendarService.getPetEvents(selectedPetId)
        : calendarService.getAllEvents());

      // Formatear eventos y actualizar el estado
      const formattedEvents = formatEvents(eventsData);
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  };

  const fetchPets = async () => {
    try {
      const petsData = await calendarService.getPets();
      setPets(petsData);
    } catch (error) {
      console.error('Error al cargar mascotas:', error);
    }
  };

  useEffect(() => {
    fetchPets();
    fetchEvents();
  }, [selectedPetId]); // Refrescar eventos cuando se cambia de mascota

  // Manejar selección de mascota
  const handlePetSelect = (petId: string | null) => {
    setSelectedPetId(petId);
    // Los eventos se actualizarán automáticamente por el useEffect
  };

  // Manejar selección de fecha en el calendario
  const handleDateSelect = (selectInfo: any) => {
    const startDate = selectInfo.startStr;
    
    // Guardar la fecha seleccionada para usarla en el modal
    const selectedDate = new Date(startDate);
    
    // Redondear a los próximos 30 minutos
    const minutes = selectedDate.getMinutes();
    const roundedMinutes = minutes < 30 ? 30 : 0;
    const hours = minutes < 30 ? selectedDate.getHours() : selectedDate.getHours() + 1;
    
    selectedDate.setHours(hours);
    selectedDate.setMinutes(roundedMinutes);
    selectedDate.setSeconds(0);
    selectedDate.setMilliseconds(0);
    
    // Establecer la fecha seleccionada para usar en el modal
    const formattedDate = selectedDate.toISOString().slice(0, 16);
    
    // Abrir el modal de creación con la fecha seleccionada
    setSelectedDate(formattedDate);
    setIsNewModalOpen(true);
  };

  // Manejar clic en un evento
  const handleEventClick = (clickInfo: any) => {
    const event = events.find(
      e => e.id === clickInfo.event.id
    );

    if (event) {
      // Establecer el evento seleccionado
      setSelectedEvent(event);
      // Establecer color
      const eventColor = clickInfo.event.backgroundColor || '#3788d8';
      setSelectedEventColor(eventColor);
      // Abrir el modal de detalles
      setIsModalOpen(true);
    }
  };

  // Cerrar modal de detalles
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Cerrar modal de creación
  const handleCloseNewModal = () => {
    setIsNewModalOpen(false);
    setSelectedDate(""); // Limpiar la fecha seleccionada
  };

  // Guardar nuevo evento
  const handleSaveEvent = async (newEvent: PetEvent) => {
    try {
      // Enviar el evento al servidor
      let result;
      
      if (newEvent.id) {
        // Actualizar evento existente
        result = await calendarService.updateEvent(newEvent);
      } else {
        // Crear nuevo evento
        result = await calendarService.createEvent(newEvent);
      }

      // Refrescar eventos
      fetchEvents();
      
      // Cerrar modales
      setIsNewModalOpen(false);
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error al guardar evento:', error);
    }
  };

  // Eliminar evento
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await calendarService.deleteEvent(eventId);
      // Refrescar eventos
      fetchEvents();
      // Cerrar modal
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error al eliminar evento:', error);
    }
  };

  // Cambiar la vista del calendario
  const handleViewChange = (view: CalendarView) => {
    setCalendarView(view);
    
    // Actualizar la vista actual del calendario cuando se hace clic en los botones
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      switch (view) {
        case 'month':
          calendarApi.changeView('dayGridMonth');
          break;
        case 'week':
          calendarApi.changeView('timeGridWeek');
          break;
        case 'day':
          calendarApi.changeView('timeGridDay');
          break;
      }
    }
  };

  // Referencia para acceder a la API del calendario
  const calendarRef = React.useRef<any>(null);

  // Obtener opciones de vista
  const getViewOptions = () => {
    return {
      dayGridMonth: { buttonText: 'Mes' },
      timeGridWeek: { buttonText: 'Semana' },
      timeGridDay: { buttonText: 'Día' }
    };
  };

  // Mapear la vista seleccionada al formato que FullCalendar espera
  const getInitialView = () => {
    switch (calendarView) {
      case 'month':
        return 'dayGridMonth';
      case 'week':
        return 'timeGridWeek';
      case 'day':
        return 'timeGridDay';
      default:
        return 'dayGridMonth';
    }
  };

  return (
    <Layout>
      <div className="calendar-container p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Calendario</h1>
          
          {/* Selector de vistas */}
          <div className="flex space-x-2 mb-4 md:mb-0">
            <button 
              className={`px-3 py-1 rounded-md ${calendarView === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => handleViewChange('month')}
            >
              Mes
            </button>
            <button 
              className={`px-3 py-1 rounded-md ${calendarView === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => handleViewChange('week')}
            >
              Semana
            </button>
            <button 
              className={`px-3 py-1 rounded-md ${calendarView === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => handleViewChange('day')}
            >
              Día
            </button>
          </div>
        </div>
        
        {/* Tarjetas de mascotas */}
        <PetCards 
          pets={pets} 
          selectedPetId={selectedPetId} 
          onPetSelect={handlePetSelect} 
        />
        
        {/* Calendario */}
        <div className="calendar-wrapper">
          <Calendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={getInitialView()}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            views={getViewOptions()}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={3}
            weekends={true}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="auto"
            eventColor="#3788d8"
            fixedWeekCount={false}
            showNonCurrentDates={true}
            displayEventEnd={true}
            eventDisplay="block"
            timeZone="UTC"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            buttonText={{
              today: 'Hoy'
            }}
            dayHeaderFormat={{
              weekday: 'short'
            }}
            titleFormat={{
              year: 'numeric',
              month: 'long'
            }}
            eventContent={(eventInfo) => {
              // Estilizar eventos según la mascota
              const eventObj = events.find(e => e.id === eventInfo.event.id);
              const petColor = eventObj?.pet_color || '#3788d8';
              
              return (
                <div className="fc-event-custom" style={{ backgroundColor: petColor, width: '100%' }}>
                  {eventInfo.timeText && (
                    <div className="fc-event-time">{eventInfo.timeText}</div>
                  )}
                  <div className="fc-event-title">{eventInfo.event.title}</div>
                </div>
              );
            }}
          />
        </div>
        
        {/* Modal de detalles de evento */}
        {isModalOpen && selectedEvent && (
          <CalendarModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            event={selectedEvent}
            onSave={handleSaveEvent}
            onDelete={handleDeleteEvent}
            pets={pets}
            eventColor={selectedEventColor}
          />
        )}
        
        {/* Modal de nuevo evento */}
        {isNewModalOpen && (
          <NewCalendarModal
            isOpen={isNewModalOpen}
            onClose={handleCloseNewModal}
            onSave={handleSaveEvent}
            pets={pets}
            selectedPetId={selectedPetId}
            selectedDate={selectedDate}
          />
        )}
      </div>
    </Layout>
  );
}

export default CalendarPage; 