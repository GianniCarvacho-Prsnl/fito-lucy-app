import { useState, useEffect, FormEvent } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { UserProfile, profileService } from '../services/profileService';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || '',
    email: user?.email || '',
    full_name: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await profileService.getProfile(user.id);
        
        if (userProfile) {
          setProfile(userProfile);
        } else {
          // Si no existe un perfil, creamos uno nuevo
          const newProfile = {
            id: user.id,
            email: user.email || '',
            full_name: '',
            phone: '',
            address: '',
          };
          await profileService.createProfile(newProfile);
          setProfile(newProfile);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Error al cargar el perfil. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await profileService.updateProfile(profile.id, profile);
      setSuccess('Perfil actualizado correctamente');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Error al actualizar el perfil. Por favor, intenta nuevamente.');
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-4">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <p className="text-green-500">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profile.email}
                disabled
                className="input-field mt-1 bg-gray-50"
              />
              <p className="mt-1 text-sm text-gray-500">El email no se puede cambiar</p>
            </div>

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Nombre Completo
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={profile.full_name || ''}
                onChange={handleChange}
                className="input-field mt-1"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profile.phone || ''}
                onChange={handleChange}
                className="input-field mt-1"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Dirección
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={profile.address || ''}
                onChange={handleChange}
                className="input-field mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
} 