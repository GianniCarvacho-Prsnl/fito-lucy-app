from supabase import create_client, Client
from app.core.config import settings
import httpx
import logging

logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """Crea y retorna una instancia del cliente Supabase."""
    try:
        # Configuración de timeout para httpx (requerido por supabase-py 1.x)
        # Aumentamos un poco los timeouts por si hay latencia
        timeout = httpx.Timeout(10.0, connect=5.0, read=15.0, write=10.0)
        
        # Inicializa el cliente Supabase
        # Para v1.0.3, los parámetros extra van en un dict `options`
        supabase_client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY,
            options={
                "persist_session": True, # Intenta mantener la sesión (útil si usáramos auth del backend)
                "auto_refresh_token": True, # Intenta refrescar token (útil si usáramos auth del backend)
                "timeout": 10, # Timeout general en segundos (afecta a postgrest-py)
                "httpx_client": httpx.Client(timeout=timeout) # Pasamos el cliente httpx configurado
            }
        )
        logger.info("Cliente Supabase inicializado exitosamente.")
        return supabase_client
    except Exception as e:
        logger.error(f"Error al inicializar el cliente Supabase: {e}")
        # Podríamos decidir si relanzar la excepción o manejarla de otra forma
        raise ConnectionError(f"No se pudo conectar a Supabase: {e}") from e

# Crear una instancia global del cliente para ser usada en la aplicación
# Esto sigue el patrón de "singleton" para evitar crear múltiples conexiones
supabase_client_instance: Client = get_supabase_client()

# Función para obtener la instancia (útil para dependencias en FastAPI)
def get_db() -> Client:
    return supabase_client_instance 