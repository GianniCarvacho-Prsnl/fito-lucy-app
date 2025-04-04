import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Pet, petService } from '../services/petService';

export default function PetList() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchPets = async () => {
      try {
        setLoading(true);
        const petsData = await petService.getPets(user.id);
        setPets(petsData);
      } catch (err) {
        console.error('Error fetching pets:', err);
        setError('Error al cargar la lista de mascotas. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [user]);

  const handleDelete = async (id?: string) => {
    if (!id || !window.confirm('¿Estás seguro de que deseas eliminar esta mascota?')) {
      return;
    }

    try {
      await petService.deletePet(id);
      setPets(pets.filter(pet => pet.id !== id));
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

  return (
    <Layout>
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Mascotas</h1>
          <Link to="/pets/new" className="btn-primary">
            Agregar Mascota
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-4">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {pets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No tienes mascotas registradas.</p>
            <Link to="/pets/new" className="btn-primary">
              Registrar mi primera mascota
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Mascota
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Especie
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Raza
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {pets.map((pet) => (
                  <tr key={pet.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {pet.photo_url ? (
                            <img className="h-10 w-10 rounded-full object-cover" src={pet.photo_url} alt={pet.name} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-lg">
                              🐾
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{pet.name}</div>
                          <div className="text-gray-500">
                            {pet.gender ? `${pet.gender}` : 'No especificado'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {pet.species}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {pet.breed || 'No especificado'}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex justify-end space-x-3">
                        <Link
                          to={`/pets/${pet.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Ver
                        </Link>
                        <Link
                          to={`/pets/edit/${pet.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(pet.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
} 