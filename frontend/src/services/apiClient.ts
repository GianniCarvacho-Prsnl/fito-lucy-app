import axios from 'axios';
import { supabase } from './supabase'; // Necesitamos supabase para obtener el token

// Obtener la URL base de la API desde las variables de entorno
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Crear una instancia de Axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Interceptor de Peticiones --- 
// Se ejecuta ANTES de que cada petición sea enviada
apiClient.interceptors.request.use(
  async (config) => {
    // Obtener el token JWT de la sesión actual de Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Si existe un token, añadirlo a la cabecera Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log("Interceptor: Token añadido a la cabecera", config.headers.Authorization);
    }
     // else {
    //   console.log("Interceptor: No hay token para añadir.");
    // }

    // Devolver la configuración modificada (o la original si no había token)
    return config;
  },
  (error) => {
    // Manejar errores durante la configuración de la petición (raro)
    console.error("Error en interceptor de petición Axios:", error);
    return Promise.reject(error);
  }
);

// --- Interceptor de Respuestas (Opcional pero útil) ---
// Se ejecuta DESPUÉS de recibir una respuesta (exitosa o errónea)
apiClient.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa (2xx), simplemente la devolvemos
    return response;
  },
  (error) => {
    // Manejar errores de respuesta centralizadamente
    console.error('Error en interceptor de respuesta Axios:', error.response || error.message || error);
    
    // Intentar extraer un mensaje de error más útil del backend
    let errorMessage = 'Ocurrió un error inesperado';
    if (error.response && error.response.data && error.response.data.detail) {
        // Error de nuestra API FastAPI (probablemente HTTPException)
        errorMessage = error.response.data.detail;
    } else if (error.request) {
        // La petición se hizo pero no se recibió respuesta (ej. problema de red)
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else {
        // Error al configurar la petición
        errorMessage = error.message;
    }

    // Podríamos hacer más cosas aquí, como redirigir al login si es un 401,
    // mostrar un toast global, etc.
    
    // Rechazamos la promesa con un error más limpio o el error original
    // Es importante rechazar para que el .catch() en el servicio/componente funcione
    return Promise.reject(new Error(errorMessage)); 
    // Alternativamente: return Promise.reject(error); 
  }
);

export default apiClient; 