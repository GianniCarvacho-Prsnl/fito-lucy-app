import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Pet, petService } from '../services/petService';
import { UserProfile, profileService } from '../services/profileService';

export default function Dashboard() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Obtener el perfil del usuario
        const userProfile = await profileService.getProfile(user.id);
        setProfile(userProfile);
        
        // Si es la primera vez que inicia sesión, crear un perfil
        if (!userProfile) {
          const newProfile = {
            id: user.id,
            email: user.email || ''
          };
          await profileService.createProfile(newProfile);
          setProfile(newProfile);
        }
        
        // Obtener las mascotas del usuario
        const userPets = await petService.getPets(user.id);
        setPets(userPets);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error al cargar los datos. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Cargando...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 p-4 rounded-md mb-4">
          <p className="text-red-500">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Sección de bienvenida */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Bienvenido, {profile?.full_name || user?.email?.split('@')[0] || 'Usuario'}!
          </h1>
          <p className="text-gray-600">
            Aquí puedes gestionar toda la información de tus mascotas.
          </p>
        </div>

        {/* Resumen de mascotas */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Tus Mascotas</h2>
            <Link
              to="/pets/new"
              className="btn-primary text-sm"
            >
              Agregar Mascota
            </Link>
          </div>

          {pets.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">Aún no has registrado mascotas.</p>
              <Link
                to="/pets/new"
                className="btn-primary"
              >
                Registrar mi primera mascota
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((pet) => (
                <Link
                  key={pet.id}
                  to={`/pets/${pet.id}`}
                  className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                      {pet.photo_url ? (
                        <img
                          src={pet.photo_url}
                          alt={pet.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">🐾</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{pet.name}</h3>
                      <p className="text-sm text-gray-500">{pet.species} - {pet.breed || 'No especificado'}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Enlaces rápidos */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Enlaces Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/pets"
              className="bg-primary-50 rounded-lg p-4 hover:bg-primary-100 transition-colors"
            >
              <h3 className="font-medium text-primary-700">Ver todas mis mascotas</h3>
            </Link>
            <Link
              to="/profile"
              className="bg-primary-50 rounded-lg p-4 hover:bg-primary-100 transition-colors"
            >
              <h3 className="font-medium text-primary-700">Actualizar mi perfil</h3>
            </Link>
            <Link
              to="/pets/new"
              className="bg-primary-50 rounded-lg p-4 hover:bg-primary-100 transition-colors"
            >
              <h3 className="font-medium text-primary-700">Registrar nueva mascota</h3>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
} 