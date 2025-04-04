import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Pet, petService } from '../services/petService';
import { useAuth } from '../context/AuthContext';

export default function PetForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pet, setPet] = useState<Pet>({
    owner_id: user?.id || '',
    name: '',
    species: '',
    breed: '',
    birthdate: '',
    gender: '',
    photo_url: '',
  });

  useEffect(() => {
    if (isEditing && id) {
      const fetchPet = async () => {
        try {
          setLoading(true);
          const petData = await petService.getPet(id);
          if (petData) {
            setPet(petData);
            if (petData.photo_url) {
              setImagePreview(petData.photo_url);
            }
          }
        } catch (err) {
          console.error('Error fetching pet:', err);
          setError('No se pudo cargar la información de la mascota.');
        } finally {
          setLoading(false);
        }
      };

      fetchPet();
    }
  }, [id, isEditing]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPet((prevPet) => ({
      ...prevPet,
      [name]: value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Crear vista previa de la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let photoUrl = pet.photo_url;

      // Subir foto si se seleccionó una nueva
      if (selectedFile) {
        const uploadedUrl = await petService.uploadPetPhoto(selectedFile);
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      // Crear o actualizar mascota
      if (isEditing && id) {
        await petService.updatePet(id, { ...pet, photo_url: photoUrl });
      } else {
        await petService.createPet({ ...pet, photo_url: photoUrl });
      }

      // Redirigir a la lista de mascotas
      navigate('/pets');
    } catch (err) {
      console.error('Error saving pet:', err);
      setError('Error al guardar la mascota. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Editar Mascota' : 'Registrar Nueva Mascota'}
        </h1>

        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-4">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información básica */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={pet.name}
                  onChange={handleChange}
                  className="input-field mt-1"
                />
              </div>

              <div>
                <label htmlFor="species" className="block text-sm font-medium text-gray-700">
                  Especie *
                </label>
                <select
                  id="species"
                  name="species"
                  required
                  value={pet.species}
                  onChange={handleChange}
                  className="input-field mt-1"
                >
                  <option value="">Seleccionar especie</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Ave">Ave</option>
                  <option value="Conejo">Conejo</option>
                  <option value="Pez">Pez</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label htmlFor="breed" className="block text-sm font-medium text-gray-700">
                  Raza
                </label>
                <input
                  type="text"
                  id="breed"
                  name="breed"
                  value={pet.breed || ''}
                  onChange={handleChange}
                  className="input-field mt-1"
                />
              </div>
            </div>

            {/* Información adicional */}
            <div className="space-y-4">
              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  id="birthdate"
                  name="birthdate"
                  value={pet.birthdate || ''}
                  onChange={handleChange}
                  className="input-field mt-1"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Género
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={pet.gender || ''}
                  onChange={handleChange}
                  className="input-field mt-1"
                >
                  <option value="">Seleccionar género</option>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
              </div>

              <div>
                <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                  Foto
                </label>
                <input
                  type="file"
                  id="photo"
                  name="photo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="h-32 w-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/pets')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Guardando...' : isEditing ? 'Actualizar Mascota' : 'Registrar Mascota'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
} 