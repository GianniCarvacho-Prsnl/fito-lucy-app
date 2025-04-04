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

export const petService = {
  // Obtener todas las mascotas del usuario actual
  async getPets(userId: string): Promise<Pet[]> {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pets:', error);
      return [];
    }
    return data || [];
  },

  // Obtener una mascota específica
  async getPet(id: string): Promise<Pet | null> {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching pet:', error);
      return null;
    }
    return data;
  },

  // Crear una nueva mascota
  async createPet(pet: Omit<Pet, 'id' | 'created_at' | 'updated_at'>): Promise<Pet | null> {
    const { data, error } = await supabase
      .from('pets')
      .insert([pet])
      .select()
      .single();

    if (error) {
      console.error('Error creating pet:', error);
      return null;
    }
    return data;
  },

  // Actualizar una mascota existente
  async updatePet(id: string, updates: Partial<Pet>): Promise<Pet | null> {
    const { data, error } = await supabase
      .from('pets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pet:', error);
      return null;
    }
    return data;
  },

  // Eliminar una mascota
  async deletePet(id: string): Promise<void> {
    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pet:', error);
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