import { supabase } from './supabase';

export interface Pet {
  id?: string;
  owner_id: string;
  name: string;
  species: string;
  breed?: string;
  birthdate?: string;
  gender?: string;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

// URL base de tu API backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const petService = {
  // Obtener todas las mascotas del usuario actual DESDE EL BACKEND
  async getPets(): Promise<Pet[]> {
    console.log("petService: llamando a getPets desde el backend...");
    try {
      // 1. Obtener la sesión actual de Supabase para el token
      const sessionResponse = await supabase.auth.getSession();
      const session = sessionResponse.data.session;

      if (!session?.access_token) {
        console.error('petService: No hay sesión activa o token.');
        throw new Error('Usuario no autenticado');
      }
      const token = session.access_token;
      // console.log("Token a enviar:", token);

      // 2. Realizar la petición fetch al backend
      const response = await fetch(`${API_BASE_URL}/pets/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // ¡IMPORTANTE! Enviar el token JWT
          'Authorization': `Bearer ${token}`,
        },
      });

      // 3. Manejar la respuesta del backend
      if (!response.ok) {
        // Intentar leer el detalle del error si el backend lo envía
        let errorDetail = 'Error desconocido del servidor';
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || JSON.stringify(errorData);
        } catch (e) {
            // No se pudo parsear el JSON de error
            errorDetail = `Error ${response.status}: ${response.statusText}`;
        }
        console.error('petService: Error en la respuesta del backend:', errorDetail);
        throw new Error(`Error al obtener mascotas: ${errorDetail}`);
      }

      const petsData: Pet[] = await response.json();
      console.log("petService: Mascotas recibidas del backend:", petsData);
      return petsData;

    } catch (error) {
      console.error('petService: Error en getPets:', error);
      // Podrías querer manejar diferentes tipos de errores aquí
      // Por simplicidad, relanzamos o devolvemos vacío
      // throw error; // Opcional: relanzar para que el componente lo maneje
      return []; // Devolver vacío para que la UI no se rompa
    }
  },

  // Crear una nueva mascota USANDO EL BACKEND
  async createPet(petData: Omit<Pet, 'id' | 'created_at' | 'updated_at' | 'owner_id'>): Promise<Pet | null> {
    console.log("petService: llamando a createPet al backend con datos:", petData);
    try {
      const sessionResponse = await supabase.auth.getSession();
      const session = sessionResponse.data.session;
      if (!session?.access_token) {
        console.error('petService: No hay sesión activa o token para crear.');
        throw new Error('Usuario no autenticado');
      }
      const token = session.access_token;

      const response = await fetch(`${API_BASE_URL}/pets/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(petData), // Enviar los datos de la mascota en el cuerpo
      });

      if (!response.ok) {
        let errorDetail = 'Error desconocido al crear mascota';
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = `Error ${response.status}: ${response.statusText}`;
        }
        console.error('petService: Error del backend al crear mascota:', errorDetail);
        // Lanzamos el error para que el formulario pueda mostrarlo
        throw new Error(`Error al crear mascota: ${errorDetail}`); 
      }

      const createdPet: Pet = await response.json();
      console.log("petService: Mascota creada vía backend:", createdPet);
      return createdPet;

    } catch (error) {
      console.error('petService: Error en createPet:', error);
      // Es importante relanzar el error aquí para que PetForm sepa que algo falló
      throw error; 
      // return null; // Ya no retornamos null, dejamos que el error se propague
    }
  },

  // Obtener una mascota específica USANDO EL BACKEND
  async getPet(id: string): Promise<Pet | null> {
    console.log(`petService: llamando a getPet al backend para ID: ${id}`);
    if (!id) {
        console.error("petService: getPet requiere un ID.");
        throw new Error("ID de mascota no válido");
    }
    try {
      const sessionResponse = await supabase.auth.getSession();
      const session = sessionResponse.data.session;
      if (!session?.access_token) {
        console.error('petService: No hay sesión activa o token para obtener mascota.');
        throw new Error('Usuario no autenticado');
      }
      const token = session.access_token;

      const response = await fetch(`${API_BASE_URL}/pets/${id}`, { // Añadir ID a la URL
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          // No es necesario Content-Type para GET sin body
        },
      });

      if (!response.ok) {
        let errorDetail = 'Error desconocido al obtener mascota';
        if (response.status === 404) {
            errorDetail = "Mascota no encontrada";
        } else {
            try {
                const errorData = await response.json();
                errorDetail = errorData.detail || JSON.stringify(errorData);
            } catch (e) {
                errorDetail = `Error ${response.status}: ${response.statusText}`;
            }
        }
        console.error('petService: Error del backend al obtener mascota:', errorDetail);
        throw new Error(`Error al obtener mascota: ${errorDetail}`);
      }

      const petData: Pet = await response.json();
      console.log("petService: Mascota obtenida vía backend:", petData);
      return petData;

    } catch (error) {
      console.error('petService: Error en getPet:', error);
      // Devolvemos null o relanzamos, dependiendo de cómo lo maneje PetDetail
      // PetDetail ya maneja el caso !pet, así que podemos devolver null
      // throw error; 
      return null; 
    }
  },

  // Actualizar una mascota existente USANDO EL BACKEND
  async updatePet(id: string, updates: Partial<Omit<Pet, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>): Promise<Pet | null> {
    console.log(`petService: llamando a updatePet al backend para ID: ${id} con datos:`, updates);
    if (!id) {
        console.error("petService: updatePet requiere un ID.");
        throw new Error("ID de mascota no válido para actualizar");
    }
    try {
      const sessionResponse = await supabase.auth.getSession();
      const session = sessionResponse.data.session;
      if (!session?.access_token) {
        console.error('petService: No hay sesión activa o token para actualizar.');
        throw new Error('Usuario no autenticado');
      }
      const token = session.access_token;

      const response = await fetch(`${API_BASE_URL}/pets/${id}`, { // Añadir ID a la URL
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates), // Enviar solo los campos a actualizar
      });

      if (!response.ok) {
        let errorDetail = 'Error desconocido al actualizar mascota';
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || JSON.stringify(errorData);
        } catch (e) {
            errorDetail = `Error ${response.status}: ${response.statusText}`;
        }
        console.error('petService: Error del backend al actualizar mascota:', errorDetail);
        throw new Error(`Error al actualizar mascota: ${errorDetail}`);
      }

      const updatedPet: Pet = await response.json();
      console.log("petService: Mascota actualizada vía backend:", updatedPet);
      return updatedPet;

    } catch (error) {
      console.error('petService: Error en updatePet:', error);
      throw error; // Relanzar para que el formulario lo maneje
      // return null;
    }
  },

  // Eliminar una mascota USANDO EL BACKEND
  async deletePet(id: string): Promise<void> {
    console.log(`petService: llamando a deletePet al backend para ID: ${id}`);
    if (!id) {
        console.error("petService: deletePet requiere un ID.");
        throw new Error("ID de mascota no válido para eliminar");
    }
    try {
      const sessionResponse = await supabase.auth.getSession();
      const session = sessionResponse.data.session;
      if (!session?.access_token) {
        console.error('petService: No hay sesión activa o token para eliminar.');
        throw new Error('Usuario no autenticado');
      }
      const token = session.access_token;

      const response = await fetch(`${API_BASE_URL}/pets/${id}`, { // Añadir ID a la URL
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          // No se necesita Content-Type para DELETE sin body
        },
      });

      // DELETE exitoso devuelve 204 No Content, response.ok será true pero no habrá body
      if (!response.ok) {
        let errorDetail = 'Error desconocido al eliminar mascota';
        // Intentar leer error si no es 204
        if (response.status !== 204) { 
          try {
              const errorData = await response.json();
              errorDetail = errorData.detail || JSON.stringify(errorData);
          } catch (e) {
              errorDetail = `Error ${response.status}: ${response.statusText}`;
          }
        }
        console.error('petService: Error del backend al eliminar mascota:', errorDetail);
        throw new Error(`Error al eliminar mascota: ${errorDetail}`);
      }

      console.log(`petService: Mascota ${id} eliminada vía backend.`);
      // No retornamos nada en caso de éxito (void)

    } catch (error) {
      console.error('petService: Error en deletePet:', error);
      throw error; // Relanzar para que el componente lo maneje
    }
  },

  // Subir una foto de mascota
  async uploadPetPhoto(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from('pet_photos')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading photo:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('pet_photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
}; 