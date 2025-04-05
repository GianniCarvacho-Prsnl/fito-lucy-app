// import { supabase } from './supabase'; // Ya no es necesario aquí si apiClient lo maneja
import apiClient from './apiClient'; // Importamos nuestra instancia de Axios

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

// Ya no necesitamos API_BASE_URL aquí, lo define apiClient
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const petService = {
  // Obtener todas las mascotas usando apiClient
  async getPets(): Promise<Pet[]> { 
    console.log("petService: llamando a getPets (axios)...");
    try {
      // Petición GET a /pets/ (la base URL y token los añade apiClient)
      const response = await apiClient.get<Pet[]>('/pets/'); 
      // Axios devuelve los datos directamente en response.data
      console.log("petService: Mascotas recibidas (axios):", response.data);
      return response.data;
    } catch (error) {
      console.error('petService: Error en getPets (axios):', error);
      // El interceptor de respuesta ya debería haber formateado el error
      throw error; // Relanzar el error formateado
      // return []; // O devolver vacío si preferimos no propagar
    }
  },

  // Crear una nueva mascota usando apiClient
  async createPet(petData: Omit<Pet, 'id' | 'created_at' | 'updated_at' | 'owner_id'>): Promise<Pet | null> {
    console.log("petService: llamando a createPet (axios) con datos:", petData);
    try {
      // Petición POST a /pets/
      const response = await apiClient.post<Pet>('/pets/', petData);
      console.log("petService: Mascota creada (axios):", response.data);
      return response.data;
    } catch (error) {
      console.error('petService: Error en createPet (axios):', error);
      throw error; // Relanzar el error formateado
    }
  },

  // Actualizar una mascota existente usando apiClient
  async updatePet(id: string, updates: Partial<Omit<Pet, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>): Promise<Pet | null> {
    console.log(`petService: llamando a updatePet (axios) para ID: ${id} con datos:`, updates);
    if (!id) {
        throw new Error("ID de mascota no válido para actualizar");
    }
    try {
      // Petición PUT a /pets/{id}
      const response = await apiClient.put<Pet>(`/pets/${id}`, updates);
      console.log("petService: Mascota actualizada (axios):", response.data);
      return response.data;
    } catch (error) {
      console.error('petService: Error en updatePet (axios):', error);
      throw error; // Relanzar el error formateado
    }
  },

  // Obtener una mascota específica usando apiClient
  async getPet(id: string): Promise<Pet | null> {
    console.log(`petService: llamando a getPet (axios) para ID: ${id}`);
    if (!id) {
        throw new Error("ID de mascota no válido");
    }
    try {
      // Petición GET a /pets/{id}
      const response = await apiClient.get<Pet>(`/pets/${id}`);
      console.log("petService: Mascota obtenida (axios):", response.data);
      return response.data;
    } catch (error) {
      console.error('petService: Error en getPet (axios):', error);
      // Si el error es 404, axios lanzará un error. El interceptor lo captura.
      // Devolvemos null para mantener la compatibilidad con PetDetail (que chequea !pet)
      // O podríamos hacer que PetDetail maneje el error lanzado.
      return null; 
    }
  },

  // Eliminar una mascota usando apiClient
  async deletePet(id: string): Promise<void> {
    console.log(`petService: llamando a deletePet (axios) para ID: ${id}`);
    if (!id) {
        throw new Error("ID de mascota no válido para eliminar");
    }
    try {
      // Petición DELETE a /pets/{id}
      // Axios no devuelve datos en .data para 204 No Content
      await apiClient.delete(`/pets/${id}`);
      console.log(`petService: Mascota ${id} eliminada (axios).`);
      // No retornamos nada (void)
    } catch (error) {
      console.error('petService: Error en deletePet (axios):', error);
      throw error; // Relanzar el error formateado
    }
  },

  // Subir una foto de mascota usando apiClient
  async uploadPetPhoto(file: File): Promise<string | null> {
    console.log(`petService: llamando a uploadPetPhoto (axios) para archivo: ${file.name}`);
    if (!file) {
        throw new Error("No se proporcionó archivo para subir");
    }
    try {
      const formData = new FormData();
      formData.append('file', file); 

      // Petición POST a /pets/upload_photo
      // Para FormData, axios establecerá Content-Type correctamente
      const response = await apiClient.post<{ photo_url: string }>('/pets/upload_photo', formData, {
          headers: {
              // ¡Importante para subida de archivos con axios! 
              // Dejar que axios maneje Content-Type, pero podríamos necesitar 
              // indicar explícitamente si no funciona por defecto.
              // 'Content-Type': 'multipart/form-data', <--- Evitar esto si axios lo hace bien
          }
      });
      console.log("petService: Foto subida (axios), URL:", response.data.photo_url);
      return response.data.photo_url;
    } catch (error) {
      console.error('petService: Error en uploadPetPhoto (axios):', error);
      throw error; // Relanzar el error formateado
    }
  },
}; 