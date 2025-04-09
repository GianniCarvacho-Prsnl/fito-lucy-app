import { supabase } from './supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface CalendarEvent {
  id: string;
  user_id: string;
  mascota_id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin?: string | null;
  titulo: string;
  tipo_evento: string;
  notas?: string | null;
  created_at?: string;
  mascota?: {
    name: string;
    associated_color: string;
  };
}

// Nuevo tipo para FullCalendar
export interface PetEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  pet_id?: string;
  pet_color?: string;
  pet_name?: string;
  event_type?: string;
  notes?: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
}

export type CalendarView = 'month' | 'week' | 'day';

export interface Pet {
  id: string;
  name: string;
  associated_color: string;
  species?: string;
  photo_url?: string;
}

// Servicio para el calendario
export const calendarService = {
  // Obtener todos los eventos
  async getAllEvents(): Promise<PetEvent[]> {
    const { data, error } = await supabase
      .from('eventos_calendario')
      .select(`
        *,
        mascota:pets(id, name, associated_color, species)
      `)
      .order('fecha_hora_inicio', { ascending: true });

    if (error) {
      console.error('Error al obtener eventos:', error);
      return [];
    }

    return (data || []).map((event: CalendarEvent) => ({
      id: event.id,
      title: event.titulo,
      start: event.fecha_hora_inicio,
      end: event.fecha_hora_fin || undefined,
      pet_id: event.mascota_id,
      pet_color: event.mascota?.associated_color || '#3788d8',
      pet_name: event.mascota?.name,
      event_type: event.tipo_evento,
      notes: event.notas || undefined,
      allDay: !event.fecha_hora_fin,
      backgroundColor: event.mascota?.associated_color || '#3788d8',
      borderColor: event.mascota?.associated_color || '#3788d8'
    }));
  },

  // Obtener eventos por mascota
  async getPetEvents(petId: string): Promise<PetEvent[]> {
    const { data, error } = await supabase
      .from('eventos_calendario')
      .select(`
        *,
        mascota:pets(id, name, associated_color, species)
      `)
      .eq('mascota_id', petId)
      .order('fecha_hora_inicio', { ascending: true });

    if (error) {
      console.error('Error al obtener eventos por mascota:', error);
      return [];
    }

    return (data || []).map((event: CalendarEvent) => ({
      id: event.id,
      title: event.titulo,
      start: event.fecha_hora_inicio,
      end: event.fecha_hora_fin || undefined,
      pet_id: event.mascota_id,
      pet_color: event.mascota?.associated_color || '#3788d8',
      pet_name: event.mascota?.name,
      event_type: event.tipo_evento,
      notes: event.notas || undefined,
      allDay: !event.fecha_hora_fin,
      backgroundColor: event.mascota?.associated_color || '#3788d8',
      borderColor: event.mascota?.associated_color || '#3788d8'
    }));
  },

  // Obtener todas las mascotas
  async getPets(): Promise<Pet[]> {
    const { data, error } = await supabase
      .from('pets')
      .select('id, name, associated_color, species, photo_url');
    
    if (error) {
      console.error('Error al obtener mascotas:', error);
      return [];
    }
    
    return data || [];
  },

  // Crear evento
  async createEvent(event: PetEvent): Promise<PetEvent | null> {
    try {
      // Convertir de PetEvent a CalendarEvent
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        console.error('Usuario no autenticado');
        return null;
      }
      
      console.log("Creando evento con datos:", event);
      
      // Asegurarnos que siempre hay una fecha de fin
      // Si no existe, la establecemos a 30 minutos después del inicio
      let fechaFin = event.end;
      if (!fechaFin) {
        const startDate = new Date(event.start);
        const endDate = new Date(startDate);
        endDate.setUTCMinutes(startDate.getUTCMinutes() + 30);
        fechaFin = endDate.toISOString();
      }
      
      // Esto asegura que las fechas se guarden exactamente como vienen,
      // sin conversiones de zona horaria adicionales
      const calendarEvent = {
        user_id: user.user.id,
        mascota_id: event.pet_id || '',
        fecha_hora_inicio: event.start,
        fecha_hora_fin: fechaFin,
        titulo: event.title,
        tipo_evento: event.event_type || 'General',
        notas: event.notes
      };
      
      console.log("Datos preparados para Supabase:", calendarEvent);
      
      const { data, error } = await supabase
        .from('eventos_calendario')
        .insert(calendarEvent)
        .select()
        .single();
      
      if (error) {
        console.error('Error detallado al crear evento:', error);
        alert(`Error al crear evento: ${error.message}`);
        return null;
      }
      
      if (!data) {
        console.error('No se recibieron datos después de insertar el evento');
        return null;
      }
      
      console.log("Evento creado exitosamente:", data);
      
      // Incluir más información en el objeto de retorno
      return {
        id: data.id,
        title: data.titulo,
        start: data.fecha_hora_inicio,
        end: data.fecha_hora_fin || undefined,
        pet_id: data.mascota_id,
        event_type: data.tipo_evento,
        notes: data.notas || undefined,
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        pet_color: event.pet_color
      };
    } catch (err) {
      console.error('Error inesperado al crear evento:', err);
      alert('Error inesperado al crear evento. Revisa la consola para más detalles.');
      return null;
    }
  },

  // Actualizar evento
  async updateEvent(event: PetEvent): Promise<PetEvent | null> {
    try {
      // Verificar si el ID es temporal
      if (event.id.startsWith('temp-')) {
        // Si tiene un ID temporal, realmente debemos crear un nuevo evento
        console.log("ID temporal detectado, creando nuevo evento en lugar de actualizar");
        return this.createEvent(event);
      }
      
      console.log("Actualizando evento existente:", event);
      
      // Asegurarnos que siempre hay una fecha de fin
      // Si no existe, la establecemos a 30 minutos después del inicio
      let fechaFin = event.end;
      if (!fechaFin) {
        const startDate = new Date(event.start);
        const endDate = new Date(startDate);
        endDate.setUTCMinutes(startDate.getUTCMinutes() + 30);
        fechaFin = endDate.toISOString();
      }
      
      // Esto asegura que las fechas se guarden exactamente como vienen,
      // sin conversiones de zona horaria adicionales
      const calendarEvent = {
        mascota_id: event.pet_id,
        fecha_hora_inicio: event.start,
        fecha_hora_fin: fechaFin,
        titulo: event.title,
        tipo_evento: event.event_type || 'General',
        notas: event.notes
      };
      
      console.log("Datos preparados para actualización:", calendarEvent);
      
      const { data, error } = await supabase
        .from('eventos_calendario')
        .update(calendarEvent)
        .eq('id', event.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error detallado al actualizar evento:', error);
        alert(`Error al actualizar evento: ${error.message}`);
        return null;
      }
      
      if (!data) {
        console.error('No se recibieron datos después de actualizar el evento');
        return null;
      }
      
      console.log("Evento actualizado exitosamente:", data);
      
      return {
        id: data.id,
        title: data.titulo,
        start: data.fecha_hora_inicio,
        end: data.fecha_hora_fin || undefined,
        pet_id: data.mascota_id,
        event_type: data.tipo_evento,
        notes: data.notas || undefined,
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        pet_color: event.pet_color
      };
    } catch (err) {
      console.error('Error inesperado al actualizar evento:', err);
      alert('Error inesperado al actualizar evento. Revisa la consola para más detalles.');
      return null;
    }
  },

  // Eliminar evento
  async deleteEvent(eventId: string): Promise<boolean> {
    const { error } = await supabase
      .from('eventos_calendario')
      .delete()
      .eq('id', eventId);
    
    if (error) {
      console.error('Error al eliminar evento:', error);
      return false;
    }
    
    return true;
  }
};

export const getEvents = async (): Promise<{ data: CalendarEvent[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('eventos_calendario')
    .select(`
      *,
      mascota:pets(id, name, associated_color)
    `)
    .order('fecha_hora_inicio', { ascending: true });

  return { data, error };
};

export const getEventsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<{ data: CalendarEvent[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('eventos_calendario')
    .select(`
      *,
      mascota:pets(id, name, associated_color)
    `)
    .gte('fecha_hora_inicio', startDate)
    .lte('fecha_hora_inicio', endDate)
    .order('fecha_hora_inicio', { ascending: true });

  return { data, error };
};

export const getEventsByPet = async (
  petId: string
): Promise<{ data: CalendarEvent[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('eventos_calendario')
    .select(`
      *,
      mascota:pets(id, name, associated_color)
    `)
    .eq('mascota_id', petId)
    .order('fecha_hora_inicio', { ascending: true });

  return { data, error };
};

export const getPets = async (): Promise<{ data: Pet[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('pets')
    .select('id, name, associated_color, species, photo_url');

  return { data, error };
};

export const createEvent = async (
  event: Omit<CalendarEvent, 'id' | 'created_at'>
): Promise<{ data: CalendarEvent | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('eventos_calendario')
    .insert([event])
    .select()
    .single();

  return { data, error };
};

export const updateEvent = async (
  id: string,
  updates: Partial<Omit<CalendarEvent, 'id' | 'created_at'>>
): Promise<{ data: CalendarEvent | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('eventos_calendario')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
};

export const deleteEvent = async (
  id: string
): Promise<{ error: PostgrestError | null }> => {
  const { error } = await supabase
    .from('eventos_calendario')
    .delete()
    .eq('id', id);

  return { error };
}; 