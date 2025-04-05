import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Pet, petService } from '../services/petService';

export default function PetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/pets');
      return;
    }

    const fetchPet = async () => {
      try {
        setLoading(true);
        const petData = await petService.getPet(id);
        setPet(petData);
      } catch (err) {
        console.error('Error fetching pet:', err);
        setError('Error al cargar la información de la mascota.');
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id || !pet || !window.confirm(`¿Estás seguro de que deseas eliminar a ${pet.name}?`)) {
      return;
    }

    try {
      await petService.deletePet(id);
      navigate('/pets');
    } catch (err) {
      console.error('Error deleting pet:', err);
      setError('Error al eliminar la mascota. Por favor, intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Cargando...</p>
        </div>
      </Layout>
    );
  }

  if (!pet) {
    return (
      <Layout>
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-500">No se encontró la mascota o {error}</p>
          <Link to="/pets" className="text-primary-600 hover:text-primary-500 mt-2 block">
            Volver a la lista de mascotas
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="relative">
          {/* Header con foto */}
          <div className="h-48 bg-primary-100 flex items-center justify-center">
            {pet.photo_url ? (
              <img
                src={pet.photo_url}
                alt={pet.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-6xl">🐾</div>
            )}
          </div>
          
          {/* Acciones */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <Link
              to={`/pets/edit/${pet.id}`}
              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
            >
              ✏️
            </Link>
            <button
              onClick={handleDelete}
              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
            >
              🗑️
            </button>
          </div>
        </div>
        
        {/* Detalles */}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{pet.name}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Información Básica</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Especie</h3>
                  <p className="mt-1 text-gray-900">{pet.species}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Raza</h3>
                  <p className="mt-1 text-gray-900">{pet.breed || 'No especificado'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Género</h3>
                  <p className="mt-1 text-gray-900">{pet.gender || 'No especificado'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha de Nacimiento</h3>
                  <p className="mt-1 text-gray-900">
                    {pet.birthdate 
                      ? new Date(pet.birthdate.replace(/-/g, '/')).toLocaleDateString() 
                      : 'No especificado'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Información adicional */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Información Adicional</h2>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Fecha de registro</h3>
                <p className="mt-1 text-gray-900">
                  {pet.created_at 
                    ? new Date(pet.created_at).toLocaleDateString() 
                    : 'No disponible'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Última actualización</h3>
                <p className="mt-1 text-gray-900">
                  {pet.updated_at
                    ? new Date(pet.updated_at).toLocaleDateString()
                    : 'No disponible'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Acciones */}
        <div className="px-6 py-4 bg-gray-50 flex justify-between">
          <Link
            to="/pets"
            className="text-gray-700 font-medium"
          >
            ← Volver a la lista
          </Link>
          <div className="space-x-3">
            <Link
              to={`/pets/edit/${pet.id}`}
              className="btn-primary"
            >
              Editar
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
} 